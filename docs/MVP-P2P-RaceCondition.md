# ✅ MVP P2P · Race condition · Hot-document / Fan-out — Bản tự kiểm

> File để **verify** dự án so với yêu cầu tuần này: làm MVP cho P2P, hiểu sâu race condition & cơ chế `withTransaction`, và xét 2 ca khó: **1000 ví → 1 ví** (hot document) và **1 ví → 1000 ví** (fan-out). Mỗi mục có kết luận **đã tốt chưa**.

## Mục lục
1. MVP là gì & MVP tuần này
2. Race condition là gì (các loại lỗi đua)
3. `withTransaction` hoạt động thế nào — vì sao tránh được
4. Dự án hiện xử lý race ra sao (map vào code) + cảnh báo
5. Ca A — Hot document: 1000 ví → 1 ví (merchant nhận)
6. Ca B — Fan-out: 1 ví → 1000 ví (merchant hoàn tiền)
7. Bảng VERIFY tổng hợp (đã tốt chưa)
8. Khuyến nghị cho MVP tuần này

---

## 1. MVP là gì & MVP tuần này

**MVP (Minimum Viable Product)** = phiên bản **nhỏ nhất nhưng dùng được**, đủ để kiểm chứng giá trị cốt lõi và lấy phản hồi — không phải bản hoàn chỉnh. Nguyên tắc: làm **đúng và an toàn phần lõi**, cắt mọi thứ chưa thiết yếu, nhưng phần làm thì phải chạy thật end-to-end.

**MVP tuần này = luồng P2P chuyển tiền nội bộ chạy thật:**

| Trong phạm vi (MUST) | Ngoài phạm vi (để sau) |
|----------------------|------------------------|
| Đăng ký/đăng nhập (JWT), tặng số dư | Liên kết bank/thẻ, nạp từ thẻ |
| `request → confirm → verify` cho P2P | Chuyển liên ngân hàng async, callback |
| Ghi sổ kép (debit+credit+phí) **toàn vẹn** | Đối soát, dashboard, báo cáo |
| Chống **âm số dư**, chống **double-submit** | Tối ưu hiệu năng hot-account |
| Xem số dư + lịch sử | UI hoàn chỉnh |

> Tiêu chí "viable" của MVP P2P: **không bao giờ trừ/đẻ tiền sai**, kể cả khi có request đồng thời hay bấm trùng. Đây chính là lý do phải hiểu race condition + transaction.

---

## 2. Race condition là gì

Race condition = nhiều thao tác **chạy đồng thời** trên cùng dữ liệu, kết quả phụ thuộc thứ tự "ai tới trước" → sai. Các loại liên quan ví tiền:

| Loại | Ví dụ trong ví | Hậu quả |
|------|----------------|---------|
| **Lost update** | 2 giao dịch cùng cộng/trừ 1 ví: đọc balance=100 → cả hai ghi 100±x → mất 1 lần cập nhật | Sai số dư |
| **TOCTOU** (check-rồi-act) | Kiểm "đủ tiền" lúc t1, trừ tiền lúc t2; giữa đó số dư đã đổi | **Âm số dư** (chi vượt) |
| **Double-submit** | Bấm "Xác nhận" 2 lần / client retry | **Trừ tiền 2 lần** |
| **Dirty/non-repeatable read** | Đọc dữ liệu đang được giao dịch khác sửa dở | Quyết định trên dữ liệu sai |

---

## 3. `withTransaction` hoạt động thế nào — vì sao tránh được

MongoDB (engine **WiredTiger**) dùng **MVCC + snapshot isolation + optimistic concurrency**:

1. **Snapshot isolation:** khi `startTransaction`, giao dịch "chụp" một ảnh nhất quán của dữ liệu tại thời điểm bắt đầu. Mọi đọc trong giao dịch thấy ảnh này → **không dirty read, không non-repeatable read**.
2. **Phát hiện xung đột ghi (write conflict):** nếu 2 giao dịch cùng sửa **một document**, WiredTiger phát hiện xung đột khi commit và **abort một trong hai** với lỗi `WriteConflict` (thuộc nhóm `TransientTransactionError`).
3. **Tự retry:** helper `session.withTransaction(fn)` của driver **tự chạy lại** `fn` khi gặp `TransientTransactionError` (tới ~120s). Lần chạy lại đọc snapshot **mới** (đã có thay đổi của giao dịch thắng) rồi áp lại đúng → **không mất update**.
4. **All-or-nothing:** mọi ghi trong transaction chỉ hiện ra khi **commit**; lỗi/crash giữa chừng ⇒ **abort, rollback sạch** ⇒ không có "nửa vời" (trừ tiền mà chưa cộng).

**Điểm cốt lõi phải phân biệt rõ (hay bị hiểu nhầm):**

| Cơ chế | Giải quyết | Trong code |
|--------|-----------|-----------|
| **`$inc` / `findOneAndUpdate` (1 document)** | Race **trên một ví** (lost update, âm số dư) — vì update tại-chỗ là **atomic & tuần tự hoá ở mức document** | `moveMoney`: `findOneAndUpdate({_id, balance:{$gte:amount}}, {$inc:{balance:-amount}})` |
| **`withTransaction` (nhiều document)** | **Toàn vẹn liên-document** (debit + credit + PocketEntry + Trail cùng sống/chết) + chống crash giữa chừng | `executeLedger`: bọc cả chuỗi glSteps |

> Nói cách khác: chống **âm số dư** là nhờ **conditional `$inc`** (atomic 1 doc), **không** phải nhờ transaction. Transaction lo việc **"đã trừ thì phải cộng, không thì hoàn tác"** và chống chết giữa chừng. Hai thứ bổ trợ nhau.

Vì sao conditional `$inc` chống được TOCTOU? Vì nó **gộp "kiểm tra đủ tiền" và "trừ" vào MỘT thao tác atomic**: `{balance: {$gte: amount}}` + `$inc -amount`. Nếu không đủ, update **không khớp document nào** → trả `null` → ta báo lỗi; không có khe hở giữa "kiểm" và "trừ".

---

## 4. Dự án hiện xử lý race ra sao (map vào code)

| Rủi ro | Cách chặn trong dự án | Vị trí |
|--------|------------------------|--------|
| Âm số dư / TOCTOU | conditional `$inc` `{balance:{$gte:amount}}` (atomic) | `engine.js > moveMoney` |
| Lost update trên 1 ví | `$inc` atomic ở mức document | `moveMoney` |
| Nửa vời (trừ mà chưa cộng) | `session.withTransaction` bọc toàn bộ glSteps + Transaction + flip Trail | `engine.js > executeLedger` |
| Double-submit (1 giao dịch) | Khoá ví gửi `idle→inProgress` + guard `trail.status==='pending'` | `processVerify` |
| Sửa balance lén DB | `checksum` (sha256) tính lại sau mỗi đổi balance | `moveMoney > checksumOf` |

**⚠️ Hai cảnh báo phải verify trước khi nói "đã tốt":**

1. **Transaction có thật sự bật không?** `executeLedger` có nhánh **fallback ghi KHÔNG transaction** khi `withTransaction` lỗi. Hiện `config/datastores.js` đang dùng URL **không có `?replicaSet=rs0`**. Nếu log in `"Transaction không khả dụng, ghi sổ không-transaction"` thì **đang chạy ở chế độ KHÔNG ACID** → crash giữa chừng có thể để lại nửa vời. → **MVP nên bật lại replica set** để `withTransaction` chắc chắn hoạt động. Cách kiểm nhanh: xem log lúc verify, hoặc chạy
   ```bash
   docker exec miniwallet-mongo mongosh --quiet --eval "db.getSiblingDB('miniwallet').transaction.stats" >/dev/null 2>&1; echo "xem log warn khi verify"
   ```
2. **Guard double-submit chưa atomic tuyệt đối:** `processVerify` đọc `trail.status` rồi mới khoá ví — về lý thuyết 2 request đọc cùng `pending` trước khi ai kịp khoá. **Khoá ví CAS** (`updateOne({state:'idle'})`) cứu hầu hết, nhưng nên nâng thành **CAS claim trên Trail** (`pending→processing` atomic) như đã thiết kế trong [`docs/Xu-ly-loi-va-Resilience.md`](./docs/Xu-ly-loi-va-Resilience.md §2) + **unique index** `(transRefId, stepOrder)` ở PocketEntry làm phòng tuyến cuối.

**Kết luận mục 4:** Lõi P2P **đúng về tính toàn vẹn tiền** *với điều kiện bật replica set*. Chống double-submit ở mức **khá** (nên thêm CAS claim + unique index để chắc 100%).

---

## 5. Ca A — Hot document: 1000 ví → 1 ví (merchant nhận tiền)

**Tình huống:** 1000 khách thanh toán đồng thời cho 1 merchant → 1000 giao dịch cùng **`$inc` vào MỘT document ví merchant**.

**Đúng đắn (correctness):** ✅ Vẫn đúng. Mỗi `$inc` atomic; các transaction xung đột trên ví merchant bị `WriteConflict` → `withTransaction` tự retry → cuối cùng cộng đủ, không mất tiền.

**Hiệu năng (performance):** ⚠️ **Đây là nút cổ chai "hot document".** Vì mọi giao dịch tranh ghi cùng 1 doc:
- Tỉ lệ **abort/retry tăng vọt**, độ trễ tăng, throughput trên ví đó bị **tuần tự hoá**.
- Cực đoan: retry quá `withTransaction` timeout → một số giao dịch **fail** dù hợp lệ.

**Điểm yếu riêng của code hiện tại làm hot document tệ hơn:**
- `moveMoney` ghi ví **2 lần mỗi step**: một `$inc` balance, rồi một `updateOne` set `checksum`. → **gấp đôi số lần đụng** vào doc nóng → gấp đôi cửa sổ xung đột.
- Không lock ví nhận (tốt — tránh tuần tự hoá giả), nhưng vẫn kẹt ở tranh ghi `$inc`.

**Giải pháp (khi cần scale, ngoài MVP):**
1. **Sharded balance / counter buckets:** tách số dư merchant thành N "ô" (`balance_0..balance_{N-1}`), mỗi giao dịch cộng vào 1 ô ngẫu nhiên; số dư = tổng các ô. Giảm tranh chấp ~N lần.
2. **Append-only ledger:** không giữ field balance "nóng"; chỉ ghi `PocketEntry` (insert, không tranh ghi) và **tính số dư = tổng entry** (hoặc cộng dồn định kỳ).
3. **Gộp/đệm (aggregation):** dồn nhiều khoản cộng rồi áp một lần.
4. Gộp `checksum` vào cùng thao tác với `$inc` (pipeline update) để **chỉ ghi 1 lần/step**, hoặc bỏ checksum ở ví hệ thống/merchant nóng.

---

## 6. Ca B — Fan-out: 1 ví → 1000 ví (merchant hoàn tiền)

**Tình huống:** 1 merchant hoàn tiền cho 1000 khách → 1000 lần **trừ cùng ví nguồn** + 1000 lần cộng các ví khác nhau.

**Hai cách làm & vấn đề:**

| Cách | Vấn đề |
|------|--------|
| **Một transaction khổng lồ** (1000 glSteps) | ❌ Vượt giới hạn MongoDB: transaction nên < ~1000 doc, dễ chạm `transactionLifetimeLimitSeconds` (mặc định 60s) và giới hạn cache/oplog 16MB → **rủi ro abort cả lô**. |
| **1000 transaction nhỏ độc lập** (mỗi khoản 1 transRefId) | Đúng hơn, nhưng **ví nguồn thành hot document** (giống Ca A, lần này ở phía debit) + cần **điều phối lô** & idempotency từng khoản để retry không hoàn tiền 2 lần. |

**Điểm yếu riêng của code hiện tại:**
- ❌ **Engine chưa có "batch/fan-out"**: mỗi request chỉ là 1 giao dịch với glSteps của nó. Làm 1→1000 nghĩa là 1000 request riêng — **chưa có orchestrator** quản lý lô, tiến độ, retry, idempotency theo từng khoản.
- ❌ **Khoá ví gửi (`idle→inProgress`) sẽ TUẦN TỰ HOÁ fan-out:** vì 1000 lệnh cùng khoá **một** ví nguồn → chỉ 1 lệnh khoá được, 999 lệnh còn lại nhận `409 "ví đang bận"`. → Cơ chế khoá pessimistic hiện tại **chặn** fan-out đồng thời (an toàn nhưng không chạy song song được).

**Giải pháp (ngoài MVP):**
1. **Bỏ khoá pessimistic cho ví nguồn fan-out**, dựa vào **conditional `$inc`** atomic (đã đủ chống âm) → cho phép song song.
2. **Batch orchestrator + Outbox:** 1 "lệnh hoàn tiền lô" sinh N khoản con (mỗi khoản 1 `transRefId` idempotent), worker xử lý có **giới hạn đồng thời** (concurrency limit) + retry an toàn.
3. **Đối soát lô:** tổng đã hoàn = Σ khoản con `done`; khoản fail đưa vào hàng chờ thử lại.

---

## 7. Bảng VERIFY tổng hợp — "đã tốt chưa?"

| # | Yêu cầu | Trạng thái | Ghi chú |
|---|---------|:----------:|---------|
| 1 | **MVP P2P** chạy end-to-end | ✅ Đạt | request/confirm/verify + balance (S5–S7) |
| 2 | Chống **âm số dư** | ✅ Đạt | conditional `$inc {$gte}` atomic |
| 3 | **Toàn vẹn liên-document** (ACID) | ⚠️ Có điều kiện | **chỉ đúng khi bật replica set**; bật bằng `DATABASE_URL=...?replicaSet=rs0` (mục 8). Đã gia cố: lỗi trùng khoá `E11000` không còn rơi vào fallback |
| 4 | Chống **double-submit** | ✅ **Đã đạt** | **CAS claim** `pending→processing` + **replay idempotent** (đã done → trả biên lai cũ) + **unique index** `transaction.transRefId` & `pocketentry(transRefId,stepOrder)` |
| 5 | Hiểu **vì sao** `withTransaction` tránh race | ✅ Đạt | mục 3 (snapshot isolation + write-conflict + auto-retry; phân biệt `$inc` vs transaction) |
| 6 | **Hot document** (1000→1) | 🟡 Đúng, chưa tối ưu | correctness OK; bottleneck tranh ghi + checksum ghi 2 lần; giải pháp sharded counter/append-only (ngoài MVP) |
| 7 | **Fan-out** (1→1000) | 🟡 **Cải thiện** | thêm cờ service `concurrency:'optimistic'` → **bỏ khoá pessimistic**, cho chạy song song (an toàn nhờ `$inc`). Batch orchestrator + Outbox để sau |

Chú thích: ✅ đạt · 🟡 đạt một phần / chưa tối ưu · ⚠️ đạt có điều kiện · ❌ chưa.

### 7.1 Đã làm gì để đạt (thay đổi code lần này)
- `engine.js > processVerify`: thay guard đọc-rồi-ghi bằng **CAS claim** atomic (`updateOne({status:'pending'}).set({status:'processing'})`); thêm `finalResultOf()` để **replay** giao dịch đã kết thúc; thêm cờ `concurrency:'optimistic'` bỏ khoá ví cho fan-out.
- `engine.js > executeLedger`: lỗi `E11000` (trùng unique index) → trả 409, **không** ghi sổ lại (không fallback).
- `config/bootstrap.js`: tạo **unique index** `transaction.transRefId` và `pocketentry(transRefId, stepOrder)` lúc lift.

---

## 8. Khuyến nghị cho MVP tuần này

**Đã làm xong lần này (✅):**
1. Chống **double-submit**: CAS claim + replay idempotent + unique index (mục 7.1).
2. **Fan-out** chạy song song được: cờ service `concurrency:'optimistic'` (bỏ khoá pessimistic, dựa `$inc`).

**Còn 1 việc cần BẬT để ACID thật (do môi trường):**
- **Bật replica set** cho transaction: chạy backend với
  ```bash
  DATABASE_URL='mongodb://127.0.0.1:27017/miniwallet?replicaSet=rs0' npm run dev
  ```
  rồi verify **không** thấy log `"ghi sổ không-transaction"`. (Để mặc định URL thường vì trước đó RS discovery hay timeout; khi Docker ổn thì bật biến môi trường này.)

**Ngoài phạm vi MVP (làm sau):**
- Hot document: sharded balance / append-only ledger / gộp checksum vào 1 thao tác.
- Fan-out quy mô lớn: **batch orchestrator + Outbox** + idempotency từng khoản (cờ optimistic mới là điều kiện cần).

### Cách test nhanh double-submit (bắn 2 verify song song)
```bash
TOKEN=$(curl -s -X POST localhost:1337/api/customer/login -H 'Content-Type: application/json' -d '{"phone":"0900000001","pin":"1234"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
REF=$(curl -s -X POST localhost:1337/api/txn/request -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d '{"serviceCode":"P2P","parameters":{"receiverPhone":"0900000002","amount":50000}}')
RID=$(echo "$REF" | grep -o '"transRefId":"[^"]*"' | cut -d'"' -f4)
# bắn 2 verify cùng lúc -> chỉ 1 thành công, cái còn lại 409 hoặc replay (KHÔNG trừ 2 lần)
curl -s -X POST localhost:1337/api/txn/verify -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"transRefId\":\"$RID\",\"pin\":\"1234\"}" &
curl -s -X POST localhost:1337/api/txn/verify -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "{\"transRefId\":\"$RID\",\"pin\":\"1234\"}" &
wait
# Kiểm số dư: chỉ giảm đúng 1 lần (50000 + phí)
```

> Tóm: **double-submit ✅ đã đạt**, **fan-out 🟡 chạy song song được** (batch để sau), **hot-doc 🟡 đúng/chưa tối ưu**, **ACID ⚠️ bật bằng biến môi trường replica set**. Chi tiết resilience: [`Xu-ly-loi-va-Resilience.md`](./Xu-ly-loi-va-Resilience.md).

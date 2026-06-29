# 📝 Thay đổi — Thiết kế Resilience (xử lý lỗi)

> Liệt kê mọi thay đổi của vòng thiết kế chịu lỗi, theo yêu cầu: xử lý **spam/duplicate request**, **biller timeout**, **server crash giữa chừng**, kèm cải thiện toàn vẹn tiền tệ. Thiết kế chi tiết: [`docs/Xu-ly-loi-va-Resilience.md`](./docs/Xu-ly-loi-va-Resilience.md).

## 1. Tài liệu đã tạo / cập nhật

| File | Thay đổi |
|------|----------|
| `docs/Xu-ly-loi-va-Resilience.md` | **MỚI** — thiết kế đầy đủ 3 ca lỗi + cải thiện, kèm state machine & sequence diagram, bảng thay đổi model, pseudo-code engine. |
| `docs/Model Overview.md` | **CẬP NHẬT** — bổ sung field/status mới cho `Pocket`, `PocketEntry`, `TransactionTrail`, `Transaction`; thêm ví `suspense`/`nostro`, model `Outbox`; thêm ghi chú & link sang tài liệu resilience. |
| `THAY-DOI-RESILIENCE.md` | **MỚI** — chính file này. |

## 2. Ba ca lỗi & cách xử lý (tóm tắt)

### Ca 1 — Spam / Duplicate request
- **Claim Trail bằng CAS**: verify chỉ chạy nếu đổi được `pending → processing` (atomic), một request thắng.
- **Khoá ví bằng CAS** `idle → inProgress` (đã có) — chống 2 giao dịch cùng rút 1 ví.
- **Unique index DB**: `Transaction.transRefId`, `PocketEntry (transRefId, stepOrder)` — chặn ghi trùng ở tầng cuối.
- **Replay idempotent**: verify lại trên Trail `done` trả **biên lai cũ**, không trừ lần hai.
- **Idempotency request**: `clientRequestId` unique theo user+service ⇒ request lặp trả Trail cũ.
- **Rate-limit** mềm theo user trên `txn/*`.

### Ca 2 — Biller / đối tác timeout (in-doubt)
- **Idempotency-Key = `transRefId`** gửi đối tác ⇒ gọi lại không tính phí hai lần.
- **Phân loại lỗi**: business-decline → `failed` (không ghi sổ); connect-refused → `failed`; **timeout/5xx → `processing`** (KHÔNG kết luận).
- **Suspense trước, gọi đối tác sau** (payout): tiền khách được giữ minh bạch ở ví `suspense`.
- **Đối soát bằng `status(refId)`**: job hỏi lại đối tác → settle (`done`) hoặc reverse (`reversed`); vẫn unknown → giữ `processing` + cảnh báo thủ công.
- **Connector** có `timeoutMs`, `maxRetries` (chỉ retry lỗi mạng).

### Ca 3 — Server crash giữa chừng
- **Atomic ghi sổ**: `glSteps + Transaction + flip Trail` trong **một** `session.withTransaction` ⇒ crash = rollback sạch (yêu cầu replica set; **tắt nhánh fallback non-transaction ở production**).
- **Janitor / recovery job** (lúc lift + định kỳ): `pending` quá hạn → `expired`; `processing` treo → dò `Transaction` đã có chưa / đối soát đối tác → settle|reverse; **khoá mồ côi** → mở.
- **Khoá có hạn (lease)**: `Pocket.lockOwner` + `lockedAt`, tự mở khi quá `lockLeaseMs`.
- **Write-ahead intent**: Trail lưu kế hoạch trước khi đụng tiền ⇒ recovery tái lập chính xác.
- **Outbox** cho lời gọi ngoài ⇒ bền vững qua crash.

## 3. Thay đổi data model (cần áp dụng vào code)

| Model | Field / index thêm |
|-------|--------------------|
| `TransactionTrail` | `clientRequestId` (unique theo user+service), `processingSince`, `attempts`, `lastError`, `externalRef`; status thêm `processing`/`reversed`/`expired` (model đã khai sẵn `processing`/`reversed`; bổ sung `expired`) |
| `Pocket` | `lockOwner`, `lockedAt`; `ownerType` thêm `suspense`/`nostro` (model đã khai sẵn) |
| `Transaction` | index **unique** `transRefId` |
| `PocketEntry` | index **unique** `(transRefId, stepOrder)` |
| `Outbox` *(mới, tuỳ chọn)* | `transRefId`, `connector`, `operation`, `payload`, `status`, `attempts` |
| `Connector` *(từ thiết kế tổng quát)* | `timeoutMs`, `maxRetries`, `operations.*.idempotent` |

## 4. Thay đổi engine dự kiến (chưa áp vào `engine.js`)

> Phần này là **thiết kế**; code sẽ áp ở bước triển khai tiếp theo (S5.5). Pseudo-code đầy đủ ở [`docs/Xu-ly-loi-va-Resilience.md`](./docs/Xu-ly-loi-va-Resilience.md) §7.

- `processVerify`: thay guard `if status!=='pending'` bằng **CAS claim** `pending→processing`; thêm nhánh **replay** (done → trả biên lai cũ).
- `executeLedger`: **bắt buộc** chạy trong `withTransaction`; gỡ/đánh dấu nhánh fallback là *dev-only* và cảnh báo to khi dùng.
- Thêm `api/helpers/recover.js` (janitor) + gọi trong `config/bootstrap.js` lúc lift và đăng ký cron định kỳ.
- Khoá ví đổi sang **lease**: set `lockOwner/lockedAt` khi khoá; janitor mở khoá mồ côi.
- (Khi làm S8–S10) Connector driver: timeout + phân loại lỗi + idempotency-key; Outbox worker; ví `suspense`/`nostro` + đối soát.

## 5. Bất biến được bảo đảm

- **I1** Tổng số dư mọi ví = hằng số (job integrity kiểm định kỳ).
- **I2** Mỗi `(transRefId, stepOrder)` chỉ 1 `PocketEntry`.
- **I3** Mỗi `transRefId` chỉ tối đa 1 `Transaction` thành công.
- **I4** Ví `inProgress` luôn ứng với Trail `processing` còn sống; nếu không → khoá mồ côi sẽ được janitor mở.

## 6. Việc cần làm tiếp (checklist triển khai)

- [ ] Thêm index unique (`Transaction.transRefId`, `PocketEntry (transRefId, stepOrder)`).
- [ ] Thêm field `clientRequestId`/`lockOwner`/`lockedAt`/`processingSince` vào model + status `expired`.
- [ ] Sửa `processVerify` dùng CAS claim + replay idempotent.
- [ ] Bắt buộc `withTransaction`; bật lại replica set (`?replicaSet=rs0`) khi môi trường ổn.
- [ ] Viết janitor `recover()` + gọi ở bootstrap + cron.
- [ ] (S8–S10) Connector timeout/idempotency + Outbox + suspense/nostro + đối soát.

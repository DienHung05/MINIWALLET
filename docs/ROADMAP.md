# Roadmap — Mini-Mini-Wallet (Tuần 1)

Stack: **Sails + MongoDB (backend)** · **React + Vite (frontend)** · Auth = **Session** · Monorepo · Git

Cấu trúc đích:
```
JITS week 1/
├─ backend/      # Sails app
├─ frontend/     # React + Vite app
├─ .gitignore
└─ README.md
```

## Các giai đoạn (commit sau mỗi giai đoạn ✅)

| GĐ | Nội dung | Yêu cầu phủ |
|----|----------|-------------|
| 0  | Cài công cụ, tạo monorepo, `git init`, commit đầu | Mục 7 |
| 1  | Scaffold Sails, nối MongoDB, tắt blueprints, deny-by-default | Mục 4 (routing/policy) |
| 2  | `api/responses/` + service `respCode`, envelope `{err,message,...data}` | Mục 4 (response) |
| 3  | Models `Customer`, `Pocket`, `Transaction` | Mục 5 |
| 4  | Đăng ký (tạo ví 1.000.000) + đăng nhập + policy `isLoggedIn` | F1,F2,F3 |
| 5  | Xem số dư + Chuyển tiền (toàn vẹn, không âm, đủ tiền, hợp lệ, truy vết) | F4,F5 + Mục 6 |
| 6  | Lịch sử giao dịch (gửi đi + nhận về) | F6 |
| 7  | Frontend React+Vite: các trang đăng ký/đăng nhập/số dư/chuyển/lịch sử | UI |
| 8  | VSCode debug `launch.json`, Postman, demo end-to-end | Mục 8,9 |

## Quy ước bắt buộc (mục 4) — nhớ kỹ
- HTTP **luôn 200**; phân biệt thành/bại bằng `err` (`err===200` là OK).
- Mọi response qua `api/responses/` — không `res.json` rải rác. Luôn `return res.xxx()`.
- Mã lỗi tập trung ở service `respCode`.
- Blueprints **tắt hết**; mọi route tự khai ở `config/routes.js`.
- **Mọi API dùng POST**.
- Policies `'*': false` (deny-by-default); chỉ API công khai mới `true`.

## Quy tắc commit
Commit cuối mỗi giai đoạn, message dạng: `feat(scope): mô tả` hoặc `chore:`, `fix:`.
Ví dụ: `chore: init monorepo`, `feat(auth): register & login`, `feat(wallet): transfer money`.

---

# Roadmap — MINIWALLET (Tuần 2): Engine config-driven 3 runtime

Stack: **Sails + MongoDB** · Auth = **JWT** · Engine generic Request→Confirm→Verify.
Chi tiết thiết kế: [`THIET-KE-TUAN-2.md`](./THIET-KE-TUAN-2.md).

| GĐ | Nội dung | Yêu cầu phủ |
|----|----------|-------------|
| 9  | Models đầy đủ + seed (currency/officer/system/bank/biller) | §2, §7 |
| 10 | Ledger: `Pocket` checksum + `applyGlStep` ($inc nguyên tử) + đọc số dư | §1.3 |
| 11 | `ExecuteTransaction` (glSteps + PocketEntry + Transaction trong `session.withTransaction`) | §1.3 |
| 12 | Engine `processRequestStep` (fieldBuilder/TransField/fee/validation) | §1.1 |
| 13 | Engine `processConfirmStep` + `processVerifyStep` (lock/PIN/execute/unlock) | §1.2, §1.3 |
| 14 | Config + chạy **P2P** end-to-end | §4.1 |
| 15 | **Cash-in** (officer, bỏ confirm) | §4.2 |
| 16 | Mock Biller + **Bill Payment** (inquiry/payment/idempotency) | §4.3 |
| 17 | Admin Portal: Service / Wallet / Biller / Transaction Design (5 khối) | §6 |
| 18 | Customer UI 3 bước + balance/history; Admin Trail/History | §6 |
| 19 | Test biên: checksum, ACID rollback, double-submit, idempotency | §9 |

---

# Roadmap — MINIWALLET (Tuần 3+): Engine TỔNG QUÁT (nền tảng giao dịch)

> Mở rộng engine để chạy thêm **liên kết ngân hàng, liên kết thẻ, nạp từ thẻ, chuyển/rút liên ngân hàng (async)** — chỉ bằng **thêm config, không sửa code engine**.
> Chi tiết thiết kế: [`THIET-KE-ENGINE-TONG-QUAT.md`](./THIET-KE-ENGINE-TONG-QUAT.md).

| GĐ | Nội dung | Trục | Nghiệp vụ mở khoá |
|----|----------|------|-------------------|
| A1 | Refactor engine 3 runtime → **Pipeline of Stages** (thư viện stage generic, bật/tắt theo config) | T1 | (nền tảng — không đổi hành vi P2P/Bill) |
| A2 | Model `Connector` + helper `call-connector` (driver HTTP generic: request/response map, sign, idempotency, phân loại lỗi) | T2 | — |
| A3 | 3 mock connector: `VCB` (OTP), `VISA` (3DS/charge), `NAPAS` (payout/status) + Admin "Test operation" | T2 | — |
| B1 | Model `Instrument` (token bank/thẻ) + nguồn fieldBuilder `instrument` + validator sở hữu | T3 | — |
| B2 | Stage `RUN_HOOK` (theo pha) + `APPLY_EFFECTS` (createInstrument) + auth `OTP`/`3DS` | T1, T6 | — |
| B3 | Config + chạy **Liên kết ngân hàng** (glSteps=[], effect tạo Instrument) | T1,T3,T6 | Link bank |
| B4 | Config + chạy **Liên kết thẻ** (tokenize + 3DS) | T3,T6 | Link thẻ |
| B5 | Config + chạy **Nạp tiền từ thẻ** (hook charge, nguồn CARD_ACQUIRER) | T2,T3,T4 | Nạp từ thẻ |
| C1 | `Pocket.ownerType` += `nostro`/`suspense`; model `SystemAccount` (role→pocket); glStep level `systemAccount` | T4 | — |
| C2 | Trail status += `processing`/`reversed`; **runtime Callback** (`/api/txn/callback/:connector`) idempotent | T5 | — |
| C3 | Job **polling** trạng thái + `onTimeout` (reverse) cho Trail treo | T5 | — |
| C4 | Config + chạy **Chuyển/Rút liên ngân hàng** (verify→suspense→processing; callback→done/reversed) | T1–T5 | Chuyển/Rút liên NH |
| D1 | Màn **Đối soát (reconciliation)**: Σ nostro mỗi connector vs sao kê mock | T4,T5 | — |
| D2 | Connector CRUD + Trail viewer mở rộng (xem `transStepLog`/hook log) trong Admin | — | — |
| E1 | Hardening: test idempotency callback, reversal, timeout | I4,I5 | — |
| E2 | Property test **bảo toàn tổng số dư** (không mất tiền qua mọi luồng async) | I2,I3 | — |

## Bất biến phải giữ qua mọi GĐ (xem THIET-KE-ENGINE-TONG-QUAT §12)
- Tiền chỉ chạy ở **Verify/Callback** trong `session.withTransaction`.
- glSteps **cân bằng**; tiền in-flight luôn ở **suspense**; reversal là bút toán ngược cùng `transRefId`.
- **Idempotency 2 lớp** (callback theo `status=processing` + `Idempotency-Key=transRefId`).
- Khoá/mở ví nguồn ở **mọi lối thoát**; checksum tính lại sau mọi đổi balance.
- Instrument chỉ lưu **token + masked**, không lưu số thật; secret connector đọc từ env.

---

# Bổ sung roadmap để hoàn thiện sản phẩm

Roadmap engine phía trên vẫn là xương sống đúng. Các stage sản phẩm MVP đã được triển khai phần chính; phần còn lại nên tập trung vào hardening, QA và production readiness.

| GĐ | Nội dung | Mục tiêu |
|----|----------|----------|
| P0 | Auth customer mới | Đã làm: customer đăng ký bằng `name/username/phone/password`; đăng nhập bằng username hoặc số điện thoại; admin dùng tài khoản mặc định đã seed. |
| P1 | Quên/đặt lại mật khẩu | Đã làm API + UI `forgot-password` và `reset-password`; dev/MVP có thể trả reset token trong response để demo. |
| P2 | Design system + AppShell | Đã làm shell customer/admin, component UI cơ bản, responsive mobile. |
| P3 | Customer UX hoàn chỉnh | Đã làm dashboard ví, chuyển tiền nội bộ, chuyển liên ngân hàng, liên kết ngân hàng/thẻ, nạp tiền từ thẻ, lịch sử giao dịch. |
| P4 | Admin UX hoàn chỉnh | Đã làm tổng quan vận hành, giao dịch/trail viewer, đối soát, connector, công cụ kỹ thuật tách riêng. |
| P5 | Hoàn thiện nghiệp vụ còn thiếu | Đã làm D1 reconcile endpoint/UI, D2 connector CRUD, B4 LINK_CARD, B5 CARD_TOPUP; còn cân nhắc Cash-in/Bill Payment nếu vẫn nằm trong scope demo. |
| P6 | Hardening & QA | Đã có `backend npm run qa:engine`: test verify replay, callback idempotency SUCCESS/FAILED, timeout reversal, checksum và bảo toàn tổng số dư; còn manual e2e/production readiness nếu cần. |

Chi tiết UI/UX nằm ở [`UI-UX-REDESIGN.md`](./UI-UX-REDESIGN.md). File tổng hợp để chuyển context nằm ở [`TONG-HOP-DU-AN.md`](./TONG-HOP-DU-AN.md).

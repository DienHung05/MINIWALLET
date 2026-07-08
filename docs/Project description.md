# Tổng Hợp Dự Án — Mini Wallet

Mục tiêu là nắm được project đang làm gì, đã có gì, còn thiếu gì và nên tiếp tục theo workflow nào.

## 1. Mục tiêu sản phẩm

Mini Wallet là ví điện tử demo có backend Sails + MongoDB và frontend React + Vite.

Mục tiêu chính:

- Customer có thể đăng ký, đăng nhập, xem số dư, chuyển tiền, liên kết nguồn tiền, nạp tiền và xem lịch sử.
- Admin có thể kiểm soát vận hành: integrity/checksum, giao dịch đang xử lý, callback/recover, connector và đối soát.
- Engine giao dịch chạy theo config: Request -> Confirm -> Verify -> Callback, hạn chế sửa code engine khi thêm nghiệp vụ mới.
- Tiền phải an toàn: không âm, checksum khớp, idempotency, reversal đúng, tiền async nằm ở suspense trước khi chốt.

## 2. Stack và cách chạy

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Mặc định frontend Vite chạy ở `http://localhost:5173/`. Backend Sails dùng `http://localhost:1337/`.

Quy ước API:

- Response luôn là envelope `{ err, message, ...data }`.
- `err === 200` là thành công; lỗi nghiệp vụ vẫn trả HTTP 200 nhưng `err` khác 200.
- Frontend xử lý envelope tập trung ở `frontend/src/api/client.js`.
- Backend dùng `res.ok()` và `res.fail()`, không rải `res.json`.
- Policies deny-by-default trong `backend/config/policies.js`.

## 3. Auth hiện tại và auth mục tiêu

Hiện tại:

- Customer register/login đang dùng `phone/pin`.
- Model `Customer` có `phone`, `pinHash`, `name`, `pocket`, `status`.
- Officer/admin login dùng `username/password`.
- `backend/config/bootstrap.js` seed admin mặc định: `admin/admin123`.

Mục tiêu redesign:

- Customer đăng ký bằng `name`, `username`, `phone`, `password`.
- Customer đăng nhập bằng `identifier/password`, trong đó `identifier` là username hoặc số điện thoại.
- Thêm quên mật khẩu và đặt lại mật khẩu cho customer.
- Admin vẫn chỉ cần tài khoản mặc định đã seed trong MVP.
- Engine verify giao dịch hiện vẫn dùng PIN. Nếu muốn đổi PIN giao dịch sang password/mật khẩu xác nhận, làm ở stage riêng.

## 4. Domain chính

Các model quan trọng:

| Model                | Vai trò                                                   |
| -------------------- | ---------------------------------------------------------- |
| `Customer`         | Khách hàng, thông tin đăng nhập và ví chính.      |
| `Officer`          | Quản trị viên/admin.                                    |
| `Pocket`           | Ví/số dư; có checksum và ownerType.                   |
| `PocketEntry`      | Bút toán debit/credit theo`transRefId`.                |
| `Transaction`      | Biên lai giao dịch đã ghi sổ.                         |
| `TransactionTrail` | Nhật ký xử lý request/confirm/verify/callback.         |
| `Service`          | Cấu hình nghiệp vụ như P2P, LINK_BANK, INTERBANK_OUT. |
| `TransField`       | Rule input field.                                          |
| `TransValidation`  | Rule business validation.                                  |
| `TransDefinition`  | GL steps ghi sổ.                                          |
| `Connector`        | Cấu hình đối tác ngoài: VCB/VISA/NAPAS.              |
| `Instrument`       | Nguồn tiền đã liên kết, chỉ lưu token/masked.      |

OwnerType `Pocket` hiện có customer/system/suspense/nostro. Suspense giữ tiền đang bay ở giao dịch async; nostro là số dư gương với đối tác.

## 5. Engine và nghiệp vụ đã có

Backend hiện có:

- `P2P`: chuyển tiền nội bộ theo số điện thoại, phí cố định.
- `LINK_BANK`: liên kết ngân hàng qua VCB mock, OTP `123456`, tạo `Instrument`.
- `INTERBANK_OUT`: chuyển tiền liên ngân hàng async qua NAPAS mock, tiền đi vào suspense rồi callback chốt/hoàn.
- Connector mock:
  - VCB: `sendOtp`, `verifyOtp`.
  - VISA: `charge`.
  - NAPAS: `validateAccount`, `payout`, `status`.
- Callback async: `POST /api/txn/callback/:connector`.
- Janitor recover: helper `recover`, endpoint admin `POST /api/admin/recover`, chạy lúc lift và định kỳ.
- Admin trail viewer: `GET /api/admin/trails`.
- Admin connector list/test: `GET /api/admin/connectors`, `POST /api/admin/connector/test`.

Luồng engine:

1. `POST /api/txn/request`: build fields, validate, tính phí, tạo `TransactionTrail` pending.
2. `POST /api/txn/confirm`: chạy hook confirm nếu có, ví dụ gửi OTP.
3. `POST /api/txn/verify`: claim pending -> processing, xác thực PIN/OTP, chạy hook pre-verify, ghi sổ sync hoặc giữ suspense cho async.
4. `POST /api/txn/callback/:connector`: đối tác báo SUCCESS/FAILED để chốt done hoặc reversed.

## 6. Frontend hiện tại

Routes hiện có:

- `/`: Home.
- `/login`: customer login.
- `/register`: customer register.
- `/app`: customer dashboard.
- `/app/new`: tạo giao dịch.
- `/admin/login`: admin login.
- `/admin`: admin dashboard.

Customer hiện có:

- Xem số dư.
- Xem nguồn tiền liên kết.
- Xem lịch sử gần đây.
- Tạo giao dịch P2P, INTERBANK_OUT, LINK_BANK.

Admin hiện có:

- Integrity/checksum.
- Recover.
- Danh sách connector.
- Test connector bằng JSON args.
- Mock callback NAPAS.
- Trail viewer và xem chi tiết JSON.

## 7. Roadmap đã ổn chưa?

Roadmap engine hiện ổn và nên giữ. Tuy nhiên để hoàn thiện project như một sản phẩm ví điện tử, cần bổ sung roadmap sản phẩm:

- P0 Auth mới cho customer: username/phone + password.
- P1 Forgot/reset password.
- P2 Design system + AppShell customer/admin.
- P3 Customer UX hoàn chỉnh.
- P4 Admin UX hoàn chỉnh.
- P5 Hoàn thiện nghiệp vụ còn thiếu.
- P6 Hardening & QA.

Chi tiết đã cập nhật trong `docs/ROADMAP.md` và `docs/UI-UX-REDESIGN.md`.

## 8. Việc còn thiếu nên làm tiếp

Ưu tiên gần nhất:

1. Backend auth customer mới:
   - Thêm `username`, `passwordHash`, reset token fields nếu cần.
   - Register nhận `{ name, username, phone, password }`.
   - Login nhận `{ identifier, password }`.
   - Thêm forgot/reset password.
2. Frontend auth:
   - Login customer dùng username hoặc số điện thoại.
   - Register có username/password/confirm password.
   - Thêm forgot/reset password pages.
3. UI redesign:
   - Tạo component/layout chung.
   - Customer không thấy thuật ngữ kỹ thuật như `instrument`, `trail`, `operation`, `mock`.
   - Admin chia tab rõ: Tổng quan, Giao dịch, Đối soát, Kết nối, Công cụ kỹ thuật.
4. Hoàn thiện D1/D2:
   - D1 reconcile endpoint/UI riêng.
   - D2 connector CRUD thật, không chỉ list/test.
5. Hoàn thiện B4/B5:
   - LINK_CARD.
   - CARD_TOPUP từ thẻ qua VISA charge.
6. QA:
   - `npm run build` frontend.
   - Test callback idempotency, reversal, timeout.
   - Property test bảo toàn tổng số dư.

## 9. Bất biến phải giữ

- Tiền chỉ chạy ở Verify/Callback.
- Ghi sổ phải cân bằng debit/credit.
- Async payout phải giữ tiền ở suspense trước khi đối tác trả kết quả.
- Reversal là bút toán ngược, không sửa số dư thủ công.
- Callback phải idempotent, gọi lại không ghi sổ lần 2.
- Không lưu PAN/số thẻ thật; chỉ lưu token và masked number.
- Secret connector đọc từ env khi lên production.
- Không tự revert thay đổi user đang làm.
- Không tự commit; chỉ gợi ý commit message cho user.

## 10. Quy ước làm việc với user

User muốn làm từng cụm, sau mỗi file hoặc mỗi thay đổi đáng kể thì giải thích ngắn file đó làm gì. Đến đoạn cần commit thì nhắc user commit và chỉ đưa commit message gợi ý, không tự chạy `git commit`.

Commit message gợi ý theo dạng:

```bash
git commit -m "feat(scope): short description"
```

Với docs hiện tại có thể dùng:

```bash
git commit -m "docs(project): summarize roadmap and ui redesign"
```

# Mini Wallet

Mini Wallet là ví điện tử demo cho luồng khách hàng và quản trị vận hành. Dự án tập trung vào engine giao dịch cấu hình được, ghi sổ ví an toàn, mock connector ngân hàng/thẻ/NAPAS, đối soát và giao diện web dễ dùng cho người không chuyên kỹ thuật.

## Tính năng chính

**Customer**

- Đăng ký bằng họ tên, username, số điện thoại và mật khẩu.
- Đăng nhập bằng username hoặc số điện thoại.
- Xem số dư, nguồn tiền đã liên kết và lịch sử giao dịch.
- Chuyển tiền nội bộ giữa customer.
- Chuyển tiền liên ngân hàng qua mock NAPAS.
- Liên kết ngân hàng, liên kết thẻ và nạp tiền từ thẻ đã liên kết.
- Quên mật khẩu và đặt lại mật khẩu.

**Admin**

- Đăng nhập bằng tài khoản quản trị mặc định đã seed.
- Theo dõi giao dịch, trạng thái xử lý và nhật ký từng bước.
- Vận hành callback/recover cho giao dịch bất đồng bộ.
- Đối soát NAPAS/nostro.
- Xem, test, bật/tắt, cập nhật hoặc xoá connector mock.

**Engine backend**

- Engine giao dịch 3 bước: init, confirm, verify.
- Ghi sổ kép bằng `PocketEntry`, bảo toàn tổng số dư.
- Checksum ví để phát hiện sai lệch dữ liệu.
- Idempotency cho verify/callback để tránh xử lý trùng.
- Mock connector VCB, VISA, NAPAS để demo end-to-end.

## Công nghệ

| Lớp      | Công nghệ                                                |
| --------- | ---------------------------------------------------------- |
| Backend   | Sails 1.x, Node.js                                         |
| Database  | MongoDB chạy 1-node replica set để hỗ trợ transaction |
| Auth      | JWT, bcryptjs                                              |
| Frontend  | Vite, React, react-router-dom, axios                       |
| Dev infra | Docker Compose cho MongoDB                                 |

## Cấu trúc thư mục

```text
backend/   Sails API, model, controller, helper, engine giao dịch
frontend/  React app cho customer và admin
docs/      Roadmap, tổng hợp dự án, thiết kế engine và kế hoạch UI/UX
```

Tài liệu nên đọc:

- `docs/TONG-HOP-DU-AN.md`: tổng hợp mục tiêu, workflow, model, API và trạng thái dự án.
- `docs/ROADMAP.md`: roadmap và tiến độ các cụm backend/frontend.
- `docs/THIET-KE-ENGINE-TONG-QUAT.md`: thiết kế engine tổng quát.

## Yêu cầu cài đặt

- Node.js 18 trở lên.
- npm.
- Docker Desktop hoặc MongoDB local có replica set.

## Chạy dự án

Mở 3 terminal riêng.

```bash
# Terminal 1: bật MongoDB
docker compose up -d
```

```bash
# Terminal 2: chạy backend
cd backend
npm install
npm run dev
```

Backend chạy ở `http://localhost:1337`.

```bash
# Terminal 3: chạy frontend
cd frontend
npm install
npm run dev
```

Frontend chạy ở `http://localhost:5173` và proxy `/api` sang backend.

## Tài khoản và dữ liệu demo

Admin mặc định được seed trong `backend/config/bootstrap.js`:

```text
username: admin
password: admin123
```

Customer có thể tự đăng ký trên giao diện hoặc gọi API `POST /api/customer/register`.

Thông tin mock để demo:

| Luồng                    | Dữ liệu demo                                                                  |
| ------------------------- | ------------------------------------------------------------------------------- |
| Liên kết ngân hàng    | Chọn VCB, nhập số tài khoản bất kỳ, OTP`123456`                        |
| Liên kết thẻ           | Số thẻ`4111111111111111`, hết hạn `12/30`, CVV bất kỳ, 3DS `123456` |
| Nạp tiền từ thẻ       | Chọn thẻ đã liên kết, nhập số tiền, 3DS`123456`                      |
| Chuyển liên ngân hàng | Giao dịch đi qua mock NAPAS, admin có thể callback/recover/đối soát      |

## Route frontend

| Route                | Mục đích                                                        |
| -------------------- | ------------------------------------------------------------------ |
| `/`                | Trang chủ, tự điều hướng theo phiên đăng nhập hiện tại |
| `/login`           | Đăng nhập customer                                              |
| `/register`        | Đăng ký customer                                                |
| `/forgot-password` | Quên mật khẩu                                                   |
| `/reset-password`  | Đặt lại mật khẩu                                              |
| `/app`             | Dashboard customer                                                 |
| `/app/new`         | Tạo giao dịch, liên kết nguồn tiền, nạp tiền               |
| `/admin/login`     | Đăng nhập admin                                                 |
| `/admin`           | Dashboard vận hành admin                                         |

## API chính

Response API dùng envelope chung:

```json
{ "err": 200, "message": "ok" }
```

`err === 200` là thành công. Các lỗi nghiệp vụ trả về `err` khác `200` kèm `message`.

**Customer**

| Method   | Endpoint                          | Mục đích                                         |
| -------- | --------------------------------- | --------------------------------------------------- |
| `POST` | `/api/customer/register`        | Đăng ký customer                                 |
| `POST` | `/api/customer/login`           | Đăng nhập bằng username hoặc số điện thoại |
| `GET`  | `/api/customer/balance`         | Xem số dư                                         |
| `GET`  | `/api/customer/history`         | Xem lịch sử giao dịch                            |
| `GET`  | `/api/customer/instruments`     | Xem ngân hàng/thẻ đã liên kết                |
| `POST` | `/api/customer/forgot-password` | Tạo yêu cầu quên mật khẩu                     |
| `POST` | `/api/customer/reset-password`  | Đặt lại mật khẩu                               |

**Transaction**

| Method   | Endpoint                         | Mục đích                          |
| -------- | -------------------------------- | ------------------------------------ |
| `GET`  | `/api/services`                | Lấy danh sách dịch vụ giao dịch |
| `POST` | `/api/txn/init`                | Khởi tạo giao dịch                |
| `POST` | `/api/txn/confirm`             | Xác nhận bước nhập liệu        |
| `POST` | `/api/txn/verify`              | Xác thực và ghi sổ               |
| `POST` | `/api/txn/callback/:connector` | Callback từ connector mock          |

**Admin**

| Method   | Endpoint                         | Mục đích                       |
| -------- | -------------------------------- | --------------------------------- |
| `POST` | `/api/officer/login`           | Đăng nhập admin                |
| `GET`  | `/api/admin/trails`            | Xem nhật ký xử lý giao dịch  |
| `GET`  | `/api/admin/reconcile`         | Đối soát NAPAS/nostro          |
| `POST` | `/api/admin/recover`           | Recover giao dịch treo/quá hạn |
| `GET`  | `/api/admin/connectors`        | Danh sách connector              |
| `POST` | `/api/admin/connector/test`    | Test operation connector          |
| `POST` | `/api/admin/connectors/upsert` | Tạo hoặc cập nhật connector   |
| `POST` | `/api/admin/connectors/toggle` | Bật/tắt connector               |
| `POST` | `/api/admin/connectors/delete` | Xoá connector                    |

## Luồng demo nhanh

1. Mở `http://localhost:5173`.
2. Đăng ký customer mới bằng username, số điện thoại và mật khẩu.
3. Vào ví customer tại `/app`.
4. Vào thao tác tại `/app/new`.
5. Liên kết ngân hàng hoặc thẻ bằng dữ liệu mock ở trên.
6. Nạp tiền từ thẻ hoặc chuyển tiền cho customer khác.
7. Đăng nhập admin tại `/admin/login`.
8. Theo dõi giao dịch, callback/recover giao dịch NAPAS và chạy đối soát.

## Kiểm thử và kiểm tra build

Backend có script QA cho engine:

```bash
cd backend
npm run qa:engine
```

Script này dùng database QA riêng, kiểm tra các case quan trọng như register/login API, P2P replay, card topup replay, callback NAPAS success/failed, timeout recovery, checksum và bảo toàn tổng số dư.

Frontend build:

```bash
cd frontend
npm run build
```

## Biến môi trường

Backend có giá trị mặc định cho môi trường dev.

| Biến               | Mặc định                              | Ý nghĩa                |
| ------------------- | ---------------------------------------- | ------------------------ |
| `DATABASE_URL`    | `mongodb://127.0.0.1:27017/miniwallet` | Chuỗi kết nối MongoDB |
| `JWT_SECRET`      | `dev-secret-doi-truoc-khi-deploy`      | Khoá ký JWT            |
| `CHECKSUM_SECRET` | `dev-checksum-secret`                  | Khoá tính checksum ví |
| `PORT`            | `1337`                                 | Cổng backend            |

## Ghi chú phát triển

- Frontend chỉ hiển thị các thao tác customer cần dùng; mock/test kỹ thuật nằm trong khu vực admin.
- Admin hiện dùng một tài khoản seed mặc định để demo.

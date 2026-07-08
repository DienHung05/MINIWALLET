# UI/UX Redesign — Mini Wallet

## 1. Mục tiêu

Thiết kế lại frontend để Mini Wallet trông như một sản phẩm ví điện tử tử tế, dễ dùng cho người không chuyên kỹ thuật, nhưng vẫn giữ đúng các chức năng engine/config-driven hiện có.

Ưu tiên:

- Dễ hiểu hơn là phô kỹ thuật.
- Ít màn nhưng đủ việc.
- Luồng chính rõ ràng: đăng nhập, xem ví, chuyển tiền, nạp tiền, liên kết nguồn tiền, xem lịch sử.
- Admin có góc vận hành rõ: tổng quan, giao dịch, đối soát, connector.
- Các công cụ test/mock không xuất hiện như tính năng chính của sản phẩm.

## 2. Nguyên tắc ngôn ngữ

Không dùng thuật ngữ nội bộ trong UI customer.

| Thuật ngữ kỹ thuật | Hiển thị cho người dùng |
|---|---|
| Customer | Khách hàng |
| Officer | Quản trị viên |
| Pocket | Ví |
| Instrument | Nguồn tiền liên kết |
| Instrument ID | Mã nguồn liên kết |
| TransactionTrail | Nhật ký giao dịch |
| Connector | Kết nối đối tác |
| Operation | Thao tác hỗ trợ |
| Callback | Cập nhật trạng thái từ đối tác |
| Nostro | Số dư đối tác |
| Reconcile | Đối soát |
| Processing | Đang xử lý |
| Reversed | Đã hoàn tiền |

## 3. Cấu trúc màn hình đề xuất

### Public/Auth

- `/` hoặc `/login`: màn đăng nhập chính cho khách hàng.
- `/admin/login`: màn đăng nhập quản trị viên.
- `/register`: đăng ký khách hàng.
- `/forgot-password`: quên mật khẩu.
- `/reset-password`: đặt lại mật khẩu.

Khách hàng đăng nhập bằng `username/password` hoặc `phone/password`.

Quản trị viên dùng một tài khoản mặc định do hệ thống seed, ví dụ `admin/admin123`.

Đăng ký khách hàng gồm:

- Họ tên.
- Username.
- Số điện thoại.
- Mật khẩu.
- Nhập lại mật khẩu.

Số điện thoại vẫn dùng cho chuyển tiền P2P và xác minh khôi phục.

### Customer

- `/app`: tổng quan ví.
- `/app/transfer`: chuyển tiền trong hệ thống và chuyển ra ngân hàng.
- `/app/topup`: nạp tiền từ nguồn liên kết.
- `/app/sources`: quản lý nguồn tiền liên kết.
- `/app/history`: lịch sử giao dịch.

MVP có thể gom các route customer vào ít màn hơn, nhưng UI phải thể hiện nhóm chức năng rõ ràng bằng tab hoặc action cards.

### Admin

- `/admin`: tổng quan vận hành.
- `/admin/transactions`: theo dõi giao dịch và nhật ký xử lý.
- `/admin/reconciliation`: đối soát NAPAS/nostro.
- `/admin/connectors`: xem cấu hình kết nối đối tác.

MVP có thể giữ một dashboard duy nhất, nhưng phải chia khu vực bằng tab rõ ràng.

## 4. Customer UX

### Dashboard ví

Hiển thị đầu trang:

- Lời chào theo tên.
- Số dư ví lớn, dễ nhìn.
- Nút làm mới.
- Các hành động nhanh:
  - Chuyển tiền.
  - Nạp tiền.
  - Liên kết nguồn tiền.
  - Lịch sử.

Phần dưới:

- Danh sách nguồn tiền liên kết.
- Lịch sử giao dịch gần đây.

Nguồn tiền liên kết hiển thị:

- Loại: Ngân hàng / Thẻ.
- Đối tác: VCB / VISA.
- Số đã che.
- Chủ tài khoản.
- Trạng thái.
- Mã nguồn liên kết.

### Chuyển tiền

Luồng 3 bước:

1. Nhập thông tin.
2. Kiểm tra lại.
3. Xác nhận và nhận biên lai.

Dịch vụ:

- Chuyển tiền đến số điện thoại.
- Chuyển tiền ra ngân hàng.

Form không yêu cầu người dùng hiểu `serviceCode`.

### Nạp tiền

Luồng:

1. Chọn nguồn tiền liên kết loại thẻ.
2. Nhập số tiền.
3. Xác thực 3DS.
4. Nhận biên lai.

Nếu chưa có thẻ liên kết, hiển thị empty state và nút “Liên kết thẻ”.

### Liên kết nguồn tiền

Hai lựa chọn:

- Liên kết tài khoản ngân hàng.
- Liên kết thẻ.

Không hiển thị token thật. Chỉ hiển thị số đã che.

### Lịch sử

Danh sách dễ quét:

- Loại giao dịch.
- Số tiền.
- Phí.
- Trạng thái.
- Thời gian.
- Mã giao dịch.

Chi tiết giao dịch chỉ mở khi người dùng chọn một dòng.

## 5. Admin UX

### Tổng quan

Hiển thị các chỉ số chính:

- Tổng số ví.
- Tổng số dư.
- Checksum khớp/lệch.
- Số giao dịch đang xử lý.
- Số giao dịch cần chú ý.

### Giao dịch

Cho phép lọc theo:

- Đang xử lý.
- Thành công.
- Thất bại.
- Đã hoàn tiền.
- Hết hạn.
- Tất cả.

Bảng giao dịch hiển thị:

- Dịch vụ.
- Trạng thái.
- Số tiền.
- Đối tác.
- Mã giao dịch.
- Hành động: chọn callback, xem chi tiết.

Chi tiết giao dịch gồm:

- Input đã che dữ liệu nhạy cảm.
- TRANSBODY đã che dữ liệu nhạy cảm.
- Step log.
- Thời gian tạo/cập nhật.

### Đối soát

Khu vực đối soát NAPAS:

- Số dư sổ ví.
- Số dư đối tác.
- Chênh lệch.
- Trạng thái khớp/lệch.

Các input giả lập/mock chỉ để trong khu vực công cụ kỹ thuật, không đặt như luồng chính.

### Connector

Hiển thị:

- Mã kết nối.
- Loại.
- Base URL.
- Thao tác hỗ trợ.
- Trạng thái.

Nút test connector nếu giữ lại thì đặt dưới tiêu đề “Công cụ kỹ thuật”.

## 6. Thiết kế giao diện

Phong cách:

- Nền sáng, ít màu, ưu tiên trắng/xám nhạt.
- Màu chính xanh dương hoặc xanh lá trầm.
- Card dùng cho từng nhóm thông tin, không lồng card trong card.
- Nút chính rõ ràng; nút phụ ít nổi hơn.
- Bảng có khoảng cách đủ đọc, trạng thái dùng badge màu.

Component nên có:

- `AppShell`
- `AuthLayout`
- `Button`
- `TextField`
- `SelectField`
- `StatusBadge`
- `DataTable`
- `EmptyState`
- `Stepper`
- `Alert`

## 7. Backend/Auth hiện tại

Redesign auth đã được triển khai.

- `Customer` có `username` unique, `phone` unique, `passwordHash` và reset token fields.
- `pinHash` vẫn được giữ để engine xác nhận giao dịch theo cấu hình cũ; trong MVP hash này được set cùng mật khẩu.
- `customer/register` nhận `{ username, password, phone, name }`.
- `customer/login` nhận `{ identifier, password }`, trong đó `identifier` có thể là username hoặc số điện thoại.
- `officer/login` giữ `{ username, password }` và dùng tài khoản admin mặc định đã seed.
- Đã có:
  - `POST /api/customer/forgot-password`
  - `POST /api/customer/reset-password`

Trong dev/MVP, forgot password có thể trả reset token trong response để demo, nhưng UI không gọi nó là mock.

## 8. Roadmap sản phẩm

Roadmap engine hiện tại đúng hướng. Lớp sản phẩm phía trên engine cũng đã được triển khai phần MVP để Mini Wallet dễ dùng hơn cho customer và admin.

Trạng thái hiện tại:

- Customer đăng ký/đăng nhập bằng username hoặc số điện thoại + mật khẩu.
- Customer có quên mật khẩu và đặt lại mật khẩu.
- Admin đã có tài khoản mặc định seed trong `bootstrap`: `admin/admin123`.
- Customer UI đã có dashboard, tạo giao dịch P2P, liên ngân hàng, liên kết ngân hàng, liên kết thẻ, nạp tiền từ thẻ, lịch sử và nguồn tiền liên kết.
- Admin UI đã có tổng quan, integrity, recover, đối soát, connector CRUD/test và trail viewer.
- Backend đã có connector mock VCB/VISA/NAPAS, callback async, janitor recover, interbank out, LINK_CARD và CARD_TOPUP.
- D1 đối soát đã có endpoint/UI.
- D2 connector CRUD và trail viewer mở rộng đã có.
- B4/B5 đã có trong backend và frontend customer.

Các cụm nên làm tiếp:

| Cụm | Mục tiêu | Ghi chú UI/UX |
|---|---|---|
| P0 | Auth customer mới | Đăng ký bằng họ tên, username, số điện thoại, mật khẩu; đăng nhập bằng username hoặc số điện thoại; forgot/reset password. |
| P1 | AppShell + design system | Tách shell customer/admin, navigation rõ, component chung, responsive mobile. |
| P2 | Customer flows | Dashboard ví, chuyển tiền, chuyển liên ngân hàng, liên kết ngân hàng/thẻ, nạp tiền, lịch sử. |
| P3 | Admin flows | Tổng quan vận hành, giao dịch, đối soát, connector, công cụ kỹ thuật. |
| P4 | Backend còn thiếu | Đã hoàn thành D1 reconcile, D2 connector CRUD, B4 LINK_CARD, B5 CARD_TOPUP trong MVP. |
| P5 | Hardening | Build pass, test idempotency/reversal/timeout, property test bảo toàn tổng số dư. |

Lưu ý quan trọng: redesign đổi login/register sang `password`, nhưng engine hiện vẫn dùng `PIN` để xác thực giao dịch. Có thể giữ PIN giao dịch trong MVP, hoặc đổi sang “mật khẩu xác nhận giao dịch” ở một stage riêng để tránh lẫn logic auth với logic verify transaction.

## 9. Acceptance checklist

- Người không biết kỹ thuật có thể đăng ký, đăng nhập, xem số dư mà không cần hỏi `serviceCode`.
- Người dùng chuyển tiền P2P được trong tối đa 3 bước.
- Người dùng liên kết nguồn tiền và nạp tiền mà không thấy token/PAN.
- Admin thấy giao dịch đang xử lý và có thể xem chi tiết nhật ký.
- Admin thấy connector và đối soát bằng thuật ngữ dễ hiểu.
- Không còn chữ `mock`, `operation`, `instrument`, `trail` xuất hiện trong UI customer.
- Các công cụ test/mock chỉ nằm trong khu vực “Công cụ kỹ thuật” của admin.
- Admin không cần hiểu JSON để theo dõi giao dịch thường ngày.
- Customer có thể đăng nhập bằng username hoặc số điện thoại.
- Customer có luồng quên mật khẩu/đặt lại mật khẩu.
- Frontend responsive trên mobile.
- `npm run build` pass.

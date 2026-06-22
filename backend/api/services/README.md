# services/ — ENGINE config-driven sống ở đây

Đây là "bộ máy viết một lần" (MINIWALLET §2, §3). Code KHÔNG biết "P2P" hay "trả hoá đơn"
là gì — chỉ đọc config rồi chạy.

## Cấu trúc gợi ý (tạo dần Tuần 2)

```
services/
├── engine/
│   ├── request.js   # Ngày 6 — Bước 1: fieldBuilder, validate định dạng, tính phí, validate nghiệp vụ -> preview
│   ├── confirm.js   # Ngày 7 — Bước 2: chuẩn bị xác thực (PIN); cash-in bỏ qua
│   ├── verify.js    # Ngày 7 — Bước 3: kiểm PIN, dựng glSteps, ghi sổ ACID, tạo Transaction
│   ├── field-builder.js   # chạy luật dựng biến: cố định / mapping / query
│   ├── fee.js             # tính phí: cố định hoặc % (chặn trên), snapshot
│   └── validators/        # "thư viện validator" nghiệp vụ (đủ tiền, không tự chuyển, ...)
└── mock-biller.js   # Ngày 10 — biller giả lập (inquiry/payment + idempotency)
```

> Lưu ý: trong Sails, code dùng chung nên đặt ở `api/helpers/` (gọi `sails.helpers.*`)
> hoặc module thường trong `api/services/` rồi `require(...)`. Engine có thể tổ chức theo
> helper cho gọn (mỗi bước 1 helper). Chọn cách bạn thấy rõ ràng nhất — miễn engine generic.

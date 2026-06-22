# 🪙 Mini Wallet

Ví điện tử thu nhỏ, **config-driven**: người vận hành (Officer) tạo ra các loại giao dịch bằng cách *điền cấu hình* thay vì viết code; một **engine generic 3 bước** đọc cấu hình rồi chạy.

- 📄 Đề bài / tài liệu sản phẩm: [`MINIWALLET.md`](./MINIWALLET.md)
- 🗺️ Kế hoạch xây dựng 3 tuần (đọc cái này để biết làm gì mỗi ngày): [`KE-HOACH-3-TUAN.md`](./KE-HOACH-3-TUAN.md)

## Tech stack

| Lớp | Công nghệ |
|-----|-----------|
| Backend | Sails 1.x (Node.js) |
| Database | MongoDB (1-node replica set để bật transaction) |
| Auth | JWT + bcryptjs (hash PIN) |
| Frontend | Vite + React + react-router |

## Yêu cầu cài đặt

- Node.js ≥ 18 (khuyến nghị LTS) + npm
- Docker Desktop (để chạy MongoDB) — hoặc MongoDB cài sẵn ở chế độ replica set

## Chạy lần đầu (Ngày 1)

```bash
# 1) Bật MongoDB (chế độ replica set, đã cấu hình sẵn)
docker compose up -d
#    Chờ ~15s cho healthcheck khởi tạo replica set lần đầu.
#    Kiểm tra: docker compose ps  (cột STATUS phải là "healthy")

# 2) Backend (Sails)
cd backend
npm install
npm run dev          # = sails lift, chạy ở http://localhost:1337
#    Thử: mở http://localhost:1337/api/health  -> {"err":200,"message":"ok"}

# 3) Frontend (Vite + React) — mở terminal mới
cd frontend
npm install
npm run dev          # chạy ở http://localhost:5173 (proxy /api -> :1337)
```

## Cấu trúc

```
backend/   # Sails app — engine + API   (xem KE-HOACH §Cấu trúc)
frontend/  # Vite + React — Admin UI + Customer UI
```

## Biến môi trường

Backend đọc các biến (có giá trị mặc định cho dev, xem `backend/config/custom.js` & `datastores.js`):

| Biến | Mặc định | Ý nghĩa |
|------|----------|---------|
| `DATABASE_URL` | `mongodb://127.0.0.1:27017/miniwallet?replicaSet=rs0` | Chuỗi kết nối Mongo |
| `JWT_SECRET` | `dev-secret-doi-truoc-khi-deploy` | Khoá ký JWT (đổi ở production) |
| `CHECKSUM_SECRET` | `dev-checksum-secret` | Khoá tính checksum ví |
| `PORT` | `1337` | Cổng Sails |

> ⚠️ Đừng commit secret thật. File `.env` đã được `.gitignore`.

## Tài khoản mẫu

Sẽ tạo ở Ngày 2–4 (officer + vài customer). Cập nhật phần này khi có seed.

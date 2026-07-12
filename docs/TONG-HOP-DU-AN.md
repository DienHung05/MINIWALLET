# Tong Hop Du An - Mini Wallet

File nay la ban tom tat de chuyen context cho agent moi. Cap nhat sau stage frontend redesign va backend hardening.

## 1. Muc tieu san pham

Mini Wallet la vi dien tu demo dung backend Sails + MongoDB va frontend React + Vite.

Muc tieu chinh:

- Customer dang ky, dang nhap, xem so du, chuyen tien, lien ket nguon tien, nap tien va xem lich su.
- Admin kiem soat van hanh: integrity/checksum, giao dich dang xu ly, callback/recover, connector CRUD va doi soat.
- Engine giao dich chay theo config Request -> Confirm -> Verify -> Callback, han che sua code engine khi them nghiep vu.
- Tien phai an toan: khong am, checksum khop, idempotency, reversal dung, tien async nam o suspense truoc khi chot.

## 2. Stack va cach chay

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

Mac dinh frontend Vite chay o `http://localhost:5173/`. Backend Sails dung `http://localhost:1337/`.

Quy uoc API:

- Response API dung envelope `{ err, message, ...data }`.
- `err === 200` la thanh cong; loi nghiep vu co the van tra HTTP 200 nhung `err` khac 200.
- Frontend xu ly envelope tap trung o `frontend/src/api/client.js`.
- Backend API dung `res.ok()` va `res.fail()`; mock connector co the dung response rieng de gia lap doi tac.
- Policies deny-by-default trong `backend/config/policies.js`.

## 3. Auth hien tai

Customer:

- Register: `POST /api/customer/register` voi `{ name, username, phone, password }`.
- Login: `POST /api/customer/login` voi `{ identifier, password }`.
- `identifier` co the la username hoac so dien thoai.
- Forgot password: `POST /api/customer/forgot-password`.
- Reset password: `POST /api/customer/reset-password`.
- Model `Customer` co `username`, `phone`, `passwordHash`, `pinHash`, `name`, `pocket`, `status`, reset token fields.

Admin:

- Login: `POST /api/officer/login` voi `{ username, password }`.
- Tai khoan mac dinh seed trong `backend/config/bootstrap.js`: `admin/admin123`.

Luu y: Ben ngoai FE/API chi dung `password` cho dang nhap, dang ky va xac nhan giao dich. Engine van giu ten method noi bo legacy `PIN` cho P2P/interbank, nhung `pinHash` duoc set cung hash voi password de customer dung mot mat khau xac nhan.

## 4. Domain va model quan trong

| Model | Vai tro |
|---|---|
| `Customer` | Khach hang, thong tin dang nhap va vi chinh. |
| `Officer` | Quan tri vien/admin. |
| `Pocket` | Vi/so du; co checksum va `ownerType`. |
| `PocketEntry` | But toan debit/credit theo `transRefId`. |
| `Transaction` | Bien lai giao dich da ghi so. |
| `TransactionTrail` | Nhat ky xu ly request/confirm/verify/callback. |
| `Service` | Cau hinh nghiep vu nhu P2P, LINK_BANK, LINK_CARD, CARD_TOPUP, INTERBANK_OUT. |
| `TransField` | Rule input field. |
| `TransValidation` | Rule business validation. |
| `TransDefinition` | GL steps ghi so. |
| `Connector` | Cau hinh doi tac ngoai: VCB/VISA/NAPAS. |
| `Instrument` | Nguon tien da lien ket, chi luu token/masked. |

`Pocket.ownerType` hien co `customer`, `system`, `suspense`, `nostro`. Suspense giu tien dang bay o giao dich async; nostro la so du guong voi doi tac.

## 5. Backend da co

Nghiep vu customer:

- `P2P`: chuyen tien noi bo theo so dien thoai, phi co dinh.
- `LINK_BANK`: lien ket ngan hang qua VCB, OTP dev `123456`, tao `Instrument`.
- `LINK_CARD`: lien ket the qua VISA tokenize, 3DS dev `123456`, tao `Instrument` loai card.
- `CARD_TOPUP`: nap tien tu the da lien ket qua VISA charge, nguon tien `CARD_ACQUIRER`.
- `INTERBANK_OUT`: chuyen tien lien ngan hang async qua NAPAS, tien vao suspense roi callback chot/hoan.

Connector mock:

- VCB: `sendOtp`, `verifyOtp`.
- VISA: `tokenize`, `charge`.
- NAPAS: `validateAccount`, `payout`, `status`.

Admin/operation:

- Callback async: `POST /api/txn/callback/:connector`.
- Janitor recover: helper `recover`, endpoint `POST /api/admin/recover`, chay luc lift va dinh ky.
- Reconciliation: `GET /api/admin/reconcile`.
- Trail viewer: `GET /api/admin/trails`.
- Connector list/test/upsert/toggle/delete:
  - `GET /api/admin/connectors`
  - `POST /api/admin/connector/test`
  - `POST /api/admin/connectors/upsert`
  - `POST /api/admin/connectors/toggle`
  - `POST /api/admin/connectors/delete`

## 6. Engine workflow

1. `POST /api/txn/request`: build fields, validate, tinh phi, tao `TransactionTrail` pending.
2. `POST /api/txn/confirm`: chay hook confirm neu co, vi du gui OTP.
3. `POST /api/txn/verify`: claim pending -> processing, xac thuc credential, chay hook pre-verify, ghi so sync hoac giu suspense cho async.
4. `POST /api/txn/callback/:connector`: doi tac bao `SUCCESS`/`FAILED` de chot `done` hoac `reversed`.

Bat bien can giu:

- Tien chi chay o Verify/Callback.
- GL steps phai can bang debit/credit.
- Async payout phai giu tien o suspense truoc khi doi tac tra ket qua.
- Reversal la but toan nguoc, khong sua so du thu cong.
- Callback phai idempotent, goi lai khong ghi so lan 2.
- Khong luu PAN/so the that; chi luu token va masked number.
- Secret connector doc tu env khi len production.

## 7. Frontend hien tai

Routes:

- `/`: Home.
- `/login`: customer login.
- `/register`: customer register.
- `/forgot-password`: quen mat khau.
- `/reset-password`: dat lai mat khau.
- `/app`: customer dashboard.
- `/app/new`: tao giao dich/link source/topup.
- `/admin/login`: admin login.
- `/admin`: admin dashboard.

Customer FE:

- Dang ky/dang nhap bang username hoac so dien thoai + mat khau.
- Dashboard vi: so du, nguon tien lien ket, lich su gan day.
- Tao giao dich: chuyen tien noi bo, chuyen lien ngan hang, lien ket ngan hang, lien ket the, nap tien tu the.
- UI customer da tranh thuat ngu ky thuat nhu `instrument`, `operation`, `mock`, `trail`.

Admin FE:

- Dashboard chia tab/khu vuc: tong quan, giao dich, doi soat, ket noi doi tac, cong cu ky thuat.
- Co integrity/checksum, recover, reconcile, trail viewer, callback dieu khien, connector CRUD va connector test.

## 8. Trang thai roadmap

Da hoan thanh trong cac stage gan day:

- Auth customer moi: username/phone + password.
- Forgot/reset password ca backend va frontend.
- B4 LINK_CARD va B5 CARD_TOPUP.
- D1 reconcile endpoint/UI.
- D2 connector CRUD va trail viewer mo rong.
- Frontend redesign: AppShell, AuthLayout, UI components, customer/admin dashboard sach hon.
- Hardening nho: health response dung `res.ok`, history che token/card, bootstrap cap nhat connector operations moi.
- Engine QA script: `cd backend && npm run qa:engine`.

Con nen lam tiep:

1. Manual e2e script: register -> login -> link bank/card -> topup -> P2P -> interbank -> callback -> reconcile.
2. Production readiness neu can demo nghiem tuc: env secrets, email/SMS reset password, logging/audit, rate limit auth.
3. Tuy chon scope cu: Cash-in va Bill Payment neu giao vien/yeu cau van tinh trong project.

QA script hien co:

- Chay tren database mac dinh `mongodb://127.0.0.1:27017/miniwallet_qa`.
- Tu lift Sails o port trong, cap nhat connector mock sang port do.
- Test P2P verify replay, CARD_TOPUP replay, INTERBANK_OUT callback SUCCESS/FAILED replay.
- Test recover timeout khi trang thai doi tac UNKNOWN.
- Assert tong so du toan he thong khong doi, checksum khop va khong co vi am.

## 9. Quy uoc lam viec voi user

- Khong tu commit. Chi goi y commit message khi het mot stage.
- Khong revert thay doi cua user.
- Neu thay doi FE lon, chay `npm run build` trong `frontend`.
- Neu thay doi BE controller/helper quan trong, chay syntax check hoac smoke test phu hop.

Commit message goi y cho stage hien tai:

```bash
git commit -m "chore(project): harden flows and refresh docs"
```

# Tong Hop Du An - Mini Wallet

## 1. Muc tieu san pham

Mini Wallet la vi dien tu demo dung backend Sails + MongoDB va frontend React + Vite. Du an bam theo `docs/MINIWALLET.md`: Customer dung vi de chuyen tien va thanh toan hoa don; Officer/Admin cau hinh nghiep vu, nap tien cho khach va van hanh he thong.

Muc tieu chinh:

- Customer dang ky/dang nhap bang so dien thoai + PIN.
- Customer xem so du, chuyen tien P2P, thanh toan hoa don, xem lich su.
- Officer thuc hien Cash-in tu vi Bank sang vi Customer.
- Admin quan ly Service, Transaction Design, Vi, Biller, Customer, Trail, History.
- Engine chay theo config Request -> Confirm -> Verify, tien chi chay o Verify/Callback.
- So du an toan: double-entry, checksum, idempotency, reversal, suspense/nostro cho async.

## 2. Cach chay

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

Frontend mac dinh `http://localhost:5173/`. Backend Sails `http://localhost:1337/`.

API dung envelope `{ err, message, ...data }`; `err === 200` la thanh cong.

## 3. Auth hien tai

Customer:

- Register: `POST /api/customer/register` voi `{ name, phone, pin }`.
- Login: `POST /api/customer/login` voi `{ phone, pin }`.
- Forgot PIN: `POST /api/customer/forgot-pin`.
- Reset PIN: `POST /api/customer/reset-pin` voi `{ resetToken, pin }`.
- Model `Customer` dung `phone`, `pinHash`, `name`, `pocket`, `status`, `pinResetTokenHash`, `pinResetExpiresAt`.
- `username` neu ton tai chi la alias noi bo bang so dien thoai de tranh unique index cu; UI/API customer khong dung.

Admin:

- Login: `POST /api/officer/login` voi `{ username, password }`.
- Tai khoan seed: `admin/admin123`.

## 4. Model quan trong

| Model | Vai tro |
| --- | --- |
| `Customer` | Khach hang, phone/PIN va vi chinh. |
| `Officer` | Quan tri vien/admin. |
| `Pocket` | Vi/so du, co checksum va `ownerType`. |
| `PocketEntry` | But toan debit/credit theo `transRefId`. |
| `TransactionTrail` | Nhat ky request/confirm/verify/callback. |
| `Transaction` | Bien lai giao dich da ghi so. |
| `Service` | Cau hinh nghiep vu: P2P, CASH_IN, BILL_PAYMENT va extension. |
| `TransField` | Cau hinh field dau vao. |
| `TransValidation` | Cau hinh rule nghiep vu. |
| `TransDefinition` | Cau hinh glSteps ghi so. |
| `Biller` | Nha cung cap hoa don, inquiry/payment URL va vi biller. |
| `Connector` | Doi tac extension: VCB/VISA/NAPAS. |
| `Instrument` | Nguon tien lien ket, chi luu token/masked. |

`Pocket.ownerType` hien co `customer`, `system`, `bank`, `biller`, `suspense`, `nostro`.

## 5. Backend da co

Nghiep vu loi theo `MINIWALLET.md`:

- `P2P`: Customer chuyen tien noi bo theo so dien thoai, co phi ve `SYSTEM_FEE`.
- `CASH_IN`: Officer nap tien tu `BANK_MAIN` sang vi Customer, `auth = NONE`.
- `BILL_PAYMENT`: Customer chon Biller + ma hoa don; engine goi Inquiry de lay so tien, goi Payment o Verify, tien vao vi Biller va phi ve System.

Extension da co:

- `LINK_BANK`: lien ket ngan hang qua VCB, OTP dev `123456`.
- `LINK_CARD`: lien ket the qua VISA tokenize, 3DS dev `123456`.
- `CARD_TOPUP`: nap tien tu the da lien ket qua VISA charge.
- `INTERBANK_OUT`: chuyen lien ngan hang async qua NAPAS, tien vao suspense roi callback chot/hoan.

Mock:

- VCB: `sendOtp`, `verifyOtp`.
- VISA: `tokenize`, `charge`.
- NAPAS: `validateAccount`, `payout`, `status`.
- Biller: `/mock/biller/inquiry`, `/mock/biller/payment`; demo bills `EVN001`, `EVN002`, `WTR001`, `NET001`.

Admin API moi:

- `GET /api/admin/services`, `POST /api/admin/services/upsert`, `POST /api/admin/services/toggle`.
- `GET /api/admin/wallets`, `POST /api/admin/wallets/create`.
- `GET /api/admin/billers`, `POST /api/admin/billers/upsert`.
- `GET /api/admin/customers`.
- `POST /api/admin/cash-in`.
- `GET /api/admin/history`.
- Van giu: trails, integrity, recover, reconcile, connector CRUD/test.

Customer API moi:

- `GET /api/customer/billers`.
- `GET /api/services`.

## 6. Frontend hien tai

Routes:

- `/`: Home.
- `/login`: customer login bang so dien thoai + PIN.
- `/register`: customer register bang ho ten, so dien thoai, PIN.
- `/forgot-pin`: quen PIN.
- `/reset-pin`: dat lai PIN.
- `/app`: customer dashboard.
- `/app/new`: wizard giao dich.
- `/admin/login`: admin login.
- `/admin`: admin dashboard.

Customer FE:

- Dashboard uu tien 3 viec loi: chuyen tien, thanh toan hoa don, lich su.
- Tien ich mo rong tach rieng: chuyen lien ngan hang, lien ket ngan hang/the, nap tien tu the.
- Bill Payment khong cho khach tu nhap so tien; so tien den tu Inquiry.
- Verify giao dich bang PIN, OTP hoac 3DS tuy service.

Admin FE:

- Dashboard tabs: Tong quan, Service, Thiet ke, Vi, Biller, Customer, Cash-in, Trail, History, Doi soat, Ket noi, Cong cu.
- Transaction Design hien 5 khoi config: fieldBuilder, TransField, TransValidation, Fee, TransDefinition/glSteps.
- Cash-in cho phep Officer nap tien cho customer bang so dien thoai.
- Cong cu mock/test nam trong khu vuc admin, khong lo ra customer.

## 7. QA hien tai

Chay:

```bash
cd backend
npm run qa:engine
```

QA dang test:

- Customer register/login bang phone/PIN.
- CASH_IN server-side khong can customer PIN.
- P2P replay idempotent.
- BILL_PAYMENT inquiry/payment va replay idempotent.
- CARD_TOPUP replay.
- INTERBANK_OUT callback SUCCESS/FAILED replay.
- Recover timeout khi doi tac unknown.
- Tong so du khong doi, checksum khop, khong co vi am.

Frontend build:

```bash
cd frontend
npm run build
```

## 8. Quy uoc lam viec

- Khong tu commit; chi goi y commit message khi xong stage.
- Khong revert thay doi cua user.
- Sau thay doi FE lon, chay `npm run build`.
- Sau thay doi BE engine/config/controller quan trong, chay `npm run qa:engine`.

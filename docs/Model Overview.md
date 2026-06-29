# 📊 Sequence Diagrams & Model Overview — Mini Wallet

## Phần A — mini-mini-wallet: 

## A. Overview Model

- **Customer**: `phone` (unique), `password` (bcrypt hash), `name`, `pocket` (ref). *(Đăng ký tặng sẵn 1.000.000.)*  
- **Pocket**: `owner` (ref customer, **unique** — mỗi khách 1 ví), `balance`. *(Không có ownerType, không System/Bank/Biller, không checksum.)*  
- **Transaction**: `sender`, `receiver` (ref customer), `amount`, `senderBalanceAfter`, `receiverBalanceAfter`.

## Phần B — MINIWALLET

### B. Overview các Model

erDiagram

    CUSTOMER ||--|| POCKET : "có 1 ví"

    BILLER   ||--|| POCKET : "có 1 ví"

    SERVICE  ||--o{ TRANSFIELD : "khai field"

    SERVICE  ||--o{ TRANSVALIDATION : "khai luật"

    SERVICE  ||--|| TRANSDEFINITION : "1 kịch bản glSteps"

    SERVICE  ||--o{ TRANSACTIONTRAIL : "sinh giao dịch"

    TRANSACTIONTRAIL ||--o| TRANSACTION : "thành công \-\> biên lai"

    TRANSACTIONTRAIL ||--o{ POCKETENTRY : "các bút toán"

    POCKET   ||--o{ POCKETENTRY : "debit/credit"

    CURRENCY ||--o{ POCKET : "định giá"

    OFFICER  }o--o{ SERVICE : "vận hành/cấu hình"

**Ba nhóm model:**

| Nhóm | Model | Vai trò (field chính) |
| :---- | :---- | :---- |
| **Danh tính / Đối tác** | `Customer` | `phone` (unique), `pinHash`, `pocket`, `status` |
|  | `Officer` | `username` (unique), `passwordHash` — không RBAC |
|  | `Biller` | `code`, `name`, `pocket`, `inquiryUrl`, `paymentUrl` |
|  | `Currency` | `code` (VND), `name`, `decimal` |
| **Sổ sách**  | `Pocket` | `ownerType` (customer/system/bank/biller/**suspense**/**nostro**), `ownerRef`, `balance`, `checksum`, `state` (idle/inProgress), **`lockOwner`** (=transRefId), **`lockedAt`** (khoá có hạn), `status` |
|  | `PocketEntry` | `transRefId`, `stepOrder`, `debit` (pocketId), `credit` (pocketId), `amount` — **1 dòng \= 1 bút toán**; **unique `(transRefId, stepOrder)`** (chặn ghi trùng) |
| **Config (WHAT)** | `Service` | `code`, `serviceType`, `fieldBuilder[]`, `amountFormula`, `action`, `actionParams`, `fee`, `auth.method`, `enabled` |
|  | `TransField` | `service`, `fieldName`, `fieldFormat`, `regex`, `isRequired`, `needSecured`, `order` |
|  | `TransValidation` | `service`, `validateFunc`, `validateFields` (`:`\-sep), `order` |
|  | `TransDefinition` | `service`, `glSteps[]` \= `{order, amount, debit:{level,target}, credit:{level,target}}` |
| **Runtime / Biên lai** | `TransactionTrail` | `id` (= `transRefId`), `service`, `inputMessage`, `outputMessage` (TRANSBODY), `transStepLog[]`, `status` (init/pending/**processing**/done/failed/**reversed**/**expired**), **`clientRequestId`** (idempotency, unique theo user+service), **`processingSince`**, **`attempts`**, **`lastError`**, **`externalRef`** |
|  | `Transaction` | `code`, **`transRefId` (unique)**, `service`, `sender`, `receiver`, `amount`, `fee`, `totalAmount`, `status`, `billerRefId` |
| **Resilience (tuỳ chọn)** | `Outbox` | `transRefId`, `connector`, `operation`, `payload`, `status`, `attempts` — gọi đối tác bền vững qua crash |

**4 loại ví (Pocket):** Customer & Biller tự sinh theo chủ thể; System (gom phí) & Bank (nguồn cash-in) do Officer tạo tay; **suspense** giữ tiền in-doubt, **nostro** để đối soát đối tác. **FK config** \= `String(service._id)`. **Tiền chỉ chạy ở Verify**, trong `session.withTransaction`.

> 🛡️ **Chịu lỗi:** xem [`Xu-ly-loi-va-Resilience.md`](./Xu-ly-loi-va-Resilience.md) cho 3 ca: spam/duplicate (claim CAS + unique index + replay idempotent), biller timeout (suspense + idempotency-key + đối soát status), server crash (atomic `withTransaction` + janitor recovery + khoá có hạn).


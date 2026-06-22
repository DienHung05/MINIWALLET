# Models — danh sách cần tạo (Ngày 2)

`Currency.js` là **mẫu hoàn chỉnh** — copy cấu trúc đó để viết các model dưới đây.
Tài liệu: MINIWALLET §9. Tự thiết kế field chi tiết (đề bài cố ý không đặc tả tới field).

## Nhóm Danh tính / Đối tác
- **Customer** — `phone` (unique), `pinHash`, `pocket` (association), `status`.
- **Officer** — `username` (unique), `passwordHash`, `status`. (KHÔNG RBAC.)
- **Biller** — `code`, `name`, `pocket`, `inquiryUrl`, `paymentUrl`.

## Nhóm Sổ sách (Ledger)
- **Pocket** — `ownerType` (customer|system|bank|biller), `ownerRef`, `balance` (number),
  `checksum` (string), `currency`, `locked` (boolean).
- **PocketEntry** — `pocket`, `transRefId`, `direction` (debit|credit), `amount`, `balanceAfter`.

## Nhóm Config (WHAT)
- **Service** — `code` (unique), `name`, `type`, `feeConfig` (json), `authType` (PIN|NONE),
  `fieldBuilder` (json array), `enabled` (boolean).
- **TransField** — `service`, `name`, `dataType`, `required`, `constraint`/`pattern`.
- **TransValidation** — `service`, `rule` (tên validator), `params` (json).
- **TransDefinition** — `service`, `glSteps` (json array: { amount, debitTarget, creditTarget }).

## Nhóm Runtime
- **TransactionTrail** — `transRefId` (unique), `service`, `inputMessage` (json),
  `outputMessage` (json), `transStepLog` (json array), `status` (init|pending|done|failed).
- **Transaction** — `transRefId`, `service`, `amount`, `fee`, `total`, `glEntries` (json),
  `status`, (Bill) `billerRefId`.

> 💡 Trên Mongo, dùng `type: 'json'` cho object/array lồng nhau. Association dùng `model: 'pocket'`.
> Đặt `unique: true` cho phone, username, code, transRefId.

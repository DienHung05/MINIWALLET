/**
 * Helper: applyGlStep  (CÀI Ở NGÀY 5 — LÕI QUAN TRỌNG NHẤT)
 * Dời tiền giữa 2 ví một cách NGUYÊN TỬ và ghi dấu vết.
 *
 * Một "bút toán" (glStep) = trừ ví debit, cộng ví credit, cùng một số tiền.
 * Phải: dùng $inc native (nguyên tử) + tính lại checksum + ghi PocketEntry.
 * Toàn bộ chuỗi glSteps của 1 giao dịch chạy trong MỘT transaction (xem run-gl-steps).
 *
 * Tài liệu: MINIWALLET §1.3 (ghi sổ kép), §1.7 (ACID), §3.2 bước 3, §3.3.
 */
module.exports = {
  friendlyName: 'Apply GL step',
  description: 'Thực hiện một bút toán: trừ ví debit, cộng ví credit (nguyên tử).',

  inputs: {
    debitPocketId: { type: 'string', required: true },
    creditPocketId: { type: 'string', required: true },
    amount: { type: 'number', required: true, min: 0 },
    transRefId: { type: 'string', required: true },
    // mongoSession: truyền session để nằm trong transaction (Ngày 5/7)
    mongoSession: { type: 'ref' },
  },

  fn: async function (inputs, exits) {
    // TODO Ngày 5 (gợi ý các bước):
    //  1) Lấy native Mongo collection từ datastore:
    //       const db = sails.getDatastore().manager;          // MongoClient.db()
    //       const pockets = db.collection('pocket');
    //       const entries = db.collection('pocketentry');
    //  2) Trừ ví debit có ĐIỀU KIỆN đủ số dư (nguyên tử):
    //       const r = await pockets.findOneAndUpdate(
    //         { _id: ..., balance: { $gte: inputs.amount } },
    //         { $inc: { balance: -inputs.amount } },
    //         { returnDocument: 'after', session: inputs.mongoSession });
    //       if (!r.value) throw new Error('Số dư không đủ');  // -> rollback transaction
    //  3) Cộng ví credit: $inc balance +amount (session).
    //  4) Tính lại checksum cho cả 2 ví (sails.helpers.computeChecksum) và update.
    //  5) Ghi 2 PocketEntry (debit & credit) kèm transRefId, balanceAfter.
    //  6) return exits.success();
    return exits.success();
  },
};

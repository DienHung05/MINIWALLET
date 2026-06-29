module.exports.models = {
  datastore: 'default',
  migrate: 'safe',
  schema: true,
  attributes: {
    createdAt: { type: 'number', autoCreatedAt: true },
    updatedAt: { type: 'number', autoUpdatedAt: true },
    id: { type: 'string', columnName: '_id' },
  },
};

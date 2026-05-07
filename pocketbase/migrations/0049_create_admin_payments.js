migrate(
  (app) => {
    const collection = new Collection({
      name: 'admin_payments',
      type: 'base',
      listRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      viewRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      createRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      updateRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'due_date', type: 'date', required: true },
        { name: 'status', type: 'bool' },
        { name: 'value', type: 'number' },
        { name: 'observation', type: 'text' },
        { name: 'reference_month', type: 'date', required: true },
        {
          name: 'admin',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE INDEX idx_admin_payments_ref_month ON admin_payments (reference_month)'],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('admin_payments')
    app.delete(collection)
  },
)

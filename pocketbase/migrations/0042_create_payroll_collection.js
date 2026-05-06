migrate(
  (app) => {
    const collection = new Collection({
      name: 'payroll',
      type: 'base',
      listRule: "@request.auth.role = 'admin'",
      viewRule: "@request.auth.role = 'admin'",
      createRule: "@request.auth.role = 'admin'",
      updateRule: "@request.auth.role = 'admin'",
      deleteRule: "@request.auth.role = 'admin'",
      fields: [
        {
          name: 'employee',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          maxSelect: 1,
        },
        { name: 'base_salary', type: 'number', required: true },
        { name: 'install_commission', type: 'number' },
        { name: 'bonus', type: 'number' },
        { name: 'extra_1', type: 'number' },
        { name: 'extra_2', type: 'number' },
        { name: 'extra_3', type: 'number' },
        { name: 'extra_4', type: 'number' },
        { name: 'total', type: 'number' },
        { name: 'reference_date', type: 'date', required: true },
        { name: 'status', type: 'select', values: ['Pendente', 'Pago'], required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('payroll')
    app.delete(collection)
  },
)

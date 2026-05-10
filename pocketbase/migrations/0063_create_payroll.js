migrate(
  (app) => {
    const collection = new Collection({
      name: 'payroll',
      type: 'base',
      listRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      viewRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      createRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      updateRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      deleteRule: "@request.auth.id != '' && @request.auth.role = 'admin'",
      fields: [
        {
          name: 'colaborador',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        { name: 'mes_referencia', type: 'number', required: true },
        { name: 'ano_referencia', type: 'number', required: true },
        { name: 'base_salary', type: 'number' },
        { name: 'unit_value', type: 'number' },
        { name: 'qtde_install', type: 'number' },
        { name: 'manual_install_qty', type: 'bool' },
        { name: 'install_commission', type: 'number' },
        { name: 'incentivo', type: 'number' },
        { name: 'bonus', type: 'number' },
        { name: 'extra_1', type: 'number' },
        { name: 'extra_2', type: 'number' },
        { name: 'extra_3', type: 'number' },
        { name: 'extra_4', type: 'number' },
        { name: 'total_a_pagar', type: 'number' },
        { name: 'status', type: 'select', values: ['pendente', 'pago'], maxSelect: 1 },
        { name: 'observacoes', type: 'text' },
        { name: 'closed', type: 'bool' },
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

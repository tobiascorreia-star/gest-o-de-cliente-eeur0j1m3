migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('admin_payments')
    col.fields.add(
      new DateField({
        name: 'data_notificacao',
        required: false,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('admin_payments')
    col.fields.add(
      new DateField({
        name: 'data_notificacao',
        required: true,
      }),
    )
    app.save(col)
  },
)

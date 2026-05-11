migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('admin_payments')
    if (!col.fields.getByName('archived')) {
      col.fields.add(new BoolField({ name: 'archived', required: false }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('admin_payments')
    if (col.fields.getByName('archived')) {
      col.fields.removeByName('archived')
      app.save(col)
    }
  },
)

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('payroll')
    if (!col.fields.getByName('incentivo')) {
      col.fields.add(new NumberField({ name: 'incentivo' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('payroll')
    if (col.fields.getByName('incentivo')) {
      col.fields.removeByName('incentivo')
      app.save(col)
    }
  },
)

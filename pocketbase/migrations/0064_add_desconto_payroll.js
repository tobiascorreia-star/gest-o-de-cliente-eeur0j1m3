migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('payroll')
    if (!col.fields.getByName('desconto')) {
      col.fields.add(new NumberField({ name: 'desconto' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('payroll')
    col.fields.removeByName('desconto')
    app.save(col)
  },
)

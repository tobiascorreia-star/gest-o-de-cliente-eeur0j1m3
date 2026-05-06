migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('payroll')
    if (!col.fields.getByName('unit_value')) {
      col.fields.add(new NumberField({ name: 'unit_value' }))
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('payroll')
    if (col.fields.getByName('unit_value')) {
      col.fields.removeByName('unit_value')
      app.save(col)
    }
  },
)

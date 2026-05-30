migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('payroll')
    col.fields.add(new TextField({ name: 'detalhamento_proventos' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('payroll')
    col.fields.removeByName('detalhamento_proventos')
    app.save(col)
  },
)

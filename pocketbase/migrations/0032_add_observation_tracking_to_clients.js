migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clients')
    col.fields.add(new BoolField({ name: 'observacao_lida' }))
    col.fields.add(new DateField({ name: 'data_leitura_observacao' }))
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clients')
    col.fields.removeByName('observacao_lida')
    col.fields.removeByName('data_leitura_observacao')
    app.save(col)
  },
)

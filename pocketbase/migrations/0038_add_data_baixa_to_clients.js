migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('clients')
    collection.fields.add(
      new DateField({
        name: 'data_baixa',
        required: false,
      }),
    )
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('clients')
    collection.fields.removeByName('data_baixa')
    app.save(collection)
  },
)

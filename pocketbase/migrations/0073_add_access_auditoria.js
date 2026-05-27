migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('users')
    collection.fields.add(new BoolField({ name: 'access_auditoria' }))
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('users')
    collection.fields.removeByName('access_auditoria')
    app.save(collection)
  },
)

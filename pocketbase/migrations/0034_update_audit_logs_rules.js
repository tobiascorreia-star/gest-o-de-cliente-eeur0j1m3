migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('audit_logs')
    collection.listRule = "@request.auth.id != ''"
    collection.viewRule = "@request.auth.id != ''"
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('audit_logs')
    collection.listRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    collection.viewRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    app.save(collection)
  },
)

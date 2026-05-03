migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('configurations')
    app.truncateCollection(col)
  },
  (app) => {
    // down: nothing to do
  },
)

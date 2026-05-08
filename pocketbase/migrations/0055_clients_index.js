migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clients')
    col.addIndex('idx_clients_status_updated', false, 'status, updated', '')
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clients')
    col.removeIndex('idx_clients_status_updated')
    app.save(col)
  },
)

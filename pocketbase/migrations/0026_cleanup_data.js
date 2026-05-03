migrate(
  (app) => {
    const clients = app.findCollectionByNameOrId('clients')
    app.truncateCollection(clients)

    const auditLogs = app.findCollectionByNameOrId('audit_logs')
    app.truncateCollection(auditLogs)

    const configs = app.findCollectionByNameOrId('configurations')
    app.truncateCollection(configs)
  },
  (app) => {
    // Cannot restore truncated data
  },
)

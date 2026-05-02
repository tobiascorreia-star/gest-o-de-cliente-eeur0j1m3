migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    try {
      const existing = app.findAuthRecordByEmail('_pb_users_auth_', 'tobias@megafllex.com')
      existing.setPassword('Fui3G35@')
      existing.set('role', 'admin')
      app.save(existing)
      return
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('tobias@megafllex.com')
    record.setPassword('Fui3G35@')
    record.setVerified(true)
    record.set('name', 'Administrador')
    record.set('role', 'admin')
    app.save(record)
  },
  (app) => {},
)

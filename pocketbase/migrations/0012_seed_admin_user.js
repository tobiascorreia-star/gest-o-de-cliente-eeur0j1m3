migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    try {
      const existing = app.findAuthRecordByEmail('_pb_users_auth_', 'tobiascorreia@gmail.com')
      existing.setPassword('Skip@Pass')
      existing.set('role', 'admin')
      existing.set('active', true)
      app.save(existing)
      return
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('tobiascorreia@gmail.com')
    record.setPassword('Skip@Pass')
    record.setVerified(true)
    record.set('name', 'Admin')
    record.set('role', 'admin')
    record.set('active', true)
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'tobiascorreia@gmail.com')
      app.delete(record)
    } catch (_) {}
  },
)

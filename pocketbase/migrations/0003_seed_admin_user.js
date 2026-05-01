migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    try {
      app.findAuthRecordByEmail('users', 'tobias@megafllex')
      return // User already exists
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('tobias@megafllex')
    record.setPassword('Fui3G35@')
    record.setVerified(true)
    record.set('name', 'Administrador')
    record.set('role', 'admin')

    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('users', 'tobias@megafllex')
      app.delete(record)
    } catch (_) {}
  },
)

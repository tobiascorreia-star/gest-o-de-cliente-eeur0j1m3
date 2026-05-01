migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    try {
      app.findAuthRecordByEmail('users', 'tobias@megafllex.com')
      return // User already exists
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('tobias@megafllex.com')
    record.setPassword('Fui3G35@')
    record.setVerified(true)
    record.set('name', 'Administrador')
    record.set('role', 'admin')

    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('users', 'tobias@megafllex.com')
      app.delete(record)
    } catch (_) {}
  },
)

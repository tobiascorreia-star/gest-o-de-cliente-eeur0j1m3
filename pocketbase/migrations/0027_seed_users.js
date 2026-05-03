migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')

    const seedUser = (email, password, role, name) => {
      let record
      try {
        record = app.findAuthRecordByEmail('users', email)
      } catch (_) {
        record = new Record(users)
        record.setEmail(email)
      }
      record.setPassword(password)
      record.setVerified(true)
      record.set('role', role)
      record.set('active', true)
      record.set('name', name)
      app.save(record)
    }

    seedUser('tobias@megafllex.com', 'Fui3G35@', 'admin', 'Admin Tobias')
    seedUser('operador@megafllex.com', 'Skip@Pass', 'operator', 'Operador')
  },
  (app) => {
    // Revert is ignored to preserve idempotent seed operations
  },
)

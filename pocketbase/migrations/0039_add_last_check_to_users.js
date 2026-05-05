migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.add(new DateField({ name: 'last_clients_check' }))
    app.save(users)

    // Initialize existing users to current time to prevent alert flood
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19) + 'Z'
    app.db().newQuery(`UPDATE users SET last_clients_check = {:now}`).bind({ now }).execute()
  },
  (app) => {
    const users = app.findCollectionByNameOrId('users')
    users.fields.removeByName('last_clients_check')
    app.save(users)
  },
)

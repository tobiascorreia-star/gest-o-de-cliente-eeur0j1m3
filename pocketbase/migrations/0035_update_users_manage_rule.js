migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('users')
    collection.manageRule = "@request.auth.role = 'admin'"
    app.save(collection)

    try {
      app.db().newQuery('UPDATE users SET emailVisibility = 1').execute()
    } catch (e) {
      console.log('Failed to update emailVisibility:', e)
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('users')
    collection.manageRule = null
    app.save(collection)

    try {
      app.db().newQuery('UPDATE users SET emailVisibility = 0').execute()
    } catch (e) {
      console.log('Failed to update emailVisibility:', e)
    }
  },
)

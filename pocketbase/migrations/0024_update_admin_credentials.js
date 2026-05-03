migrate(
  (app) => {
    try {
      const records = app.findRecordsByFilter('_pb_users_auth_', "role = 'admin'", '', 1, 0)
      if (records.length > 0) {
        const adminRecord = records[0]
        adminRecord.setEmail('tobias@megafllex.com')
        adminRecord.setPassword('Fui3G35@')
        app.save(adminRecord)
      }
    } catch (err) {
      console.log('Error updating admin credentials:', err)
    }
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'tobias@megafllex.com')
      if (record) {
        // Revert back to the known old credentials
        record.setEmail('tobiascorreia@gmail.com')
        record.setPassword('Skip@Pass')
        app.save(record)
      }
    } catch (_) {}
  },
)

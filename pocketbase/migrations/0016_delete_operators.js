migrate(
  (app) => {
    try {
      const records = app.findRecordsByFilter('users', "role = 'operator'", '', 10000, 0)
      for (const record of records) {
        app.delete(record)
      }
    } catch (e) {
      console.log('No operators found or error deleting:', e)
    }
  },
  (app) => {
    // Reverting this migration is not possible as data is permanently deleted
  },
)

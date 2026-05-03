migrate(
  (app) => {
    try {
      app.findFirstRecordByFilter('alert_settings', '1=1')
      return // already seeded
    } catch (_) {}

    const col = app.findCollectionByNameOrId('alert_settings')
    const record = new Record(col)
    record.set('moderate_threshold', 3)
    record.set('critical_threshold', 5)
    record.set('old_days', 7)
    record.set('critical_days', 10)
    app.save(record)
  },
  (app) => {
    try {
      const records = app.findRecordsByFilter('alert_settings', '1=1', '', 10, 0)
      for (const record of records) {
        app.delete(record)
      }
    } catch (_) {}
  },
)

migrate(
  (app) => {
    const settingsCol = app.findCollectionByNameOrId('alert_settings')
    app.truncateCollection(settingsCol)

    const record = new Record(settingsCol)
    record.set('moderate_threshold', 5)
    record.set('critical_threshold', 10)
    record.set('old_days', 30)
    record.set('critical_days', 60)
    app.save(record)
  },
  (app) => {
    // Empty
  },
)

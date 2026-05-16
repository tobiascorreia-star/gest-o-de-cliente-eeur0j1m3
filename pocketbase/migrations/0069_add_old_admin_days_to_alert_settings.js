migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('alert_settings')
    col.fields.add(new NumberField({ name: 'old_admin_days', required: false }))
    app.save(col)

    const records = app.findRecordsByFilter('alert_settings', '1=1', '', 1000, 0)
    for (let r of records) {
      r.set('old_admin_days', r.getInt('old_days') || 15)
      app.save(r)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('alert_settings')
    col.fields.removeByName('old_admin_days')
    app.save(col)
  },
)

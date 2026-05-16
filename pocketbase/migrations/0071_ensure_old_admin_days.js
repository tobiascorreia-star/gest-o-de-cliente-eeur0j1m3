migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('alert_settings')

    if (!col.fields.getByName('old_admin_days')) {
      col.fields.add(new NumberField({ name: 'old_admin_days' }))
      app.save(col)
    }

    app
      .db()
      .newQuery(
        'UPDATE alert_settings SET old_admin_days = 15 WHERE old_admin_days IS NULL OR old_admin_days = 0',
      )
      .execute()
  },
  (app) => {
    const col = app.findCollectionByNameOrId('alert_settings')
    if (col.fields.getByName('old_admin_days')) {
      app
        .db()
        .newQuery('UPDATE alert_settings SET old_admin_days = 0 WHERE old_admin_days = 15')
        .execute()
    }
  },
)

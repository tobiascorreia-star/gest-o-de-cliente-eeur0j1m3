migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('alert_settings')

    if (!col.fields.getByName('old_admin_days')) {
      col.fields.add(
        new NumberField({
          name: 'old_admin_days',
          required: false,
        }),
      )
      app.save(col)
    }
  },
  (app) => {
    const col = app.findCollectionByNameOrId('alert_settings')

    if (col.fields.getByName('old_admin_days')) {
      col.fields.removeByName('old_admin_days')
      app.save(col)
    }
  },
)

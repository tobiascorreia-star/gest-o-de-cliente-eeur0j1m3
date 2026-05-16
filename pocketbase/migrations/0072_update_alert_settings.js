migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('alert_settings')

    col.fields.add(
      new NumberField({
        name: 'old_days',
        required: false,
      }),
    )

    col.fields.add(
      new NumberField({
        name: 'critical_days',
        required: false,
      }),
    )

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('alert_settings')

    col.fields.add(
      new NumberField({
        name: 'old_days',
        required: true,
      }),
    )

    col.fields.add(
      new NumberField({
        name: 'critical_days',
        required: true,
      }),
    )

    app.save(col)
  },
)

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('configurations')
    col.fields.add(
      new NumberField({
        name: 'days',
        min: 0,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('configurations')
    col.fields.removeByName('days')
    app.save(col)
  },
)

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clients')
    col.fields.add(
      new RelationField({
        name: 'previous_status',
        collectionId: app.findCollectionByNameOrId('configurations').id,
        cascadeDelete: false,
        minSelect: 0,
        maxSelect: 1,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clients')
    col.fields.removeByName('previous_status')
    app.save(col)
  },
)

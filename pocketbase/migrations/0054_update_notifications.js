migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('notifications')
    if (!col.fields.getByName('client')) {
      col.fields.add(
        new RelationField({
          name: 'client',
          collectionId: app.findCollectionByNameOrId('clients').id,
          cascadeDelete: true,
          maxSelect: 1,
        }),
      )
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('notifications')
    if (col.fields.getByName('client')) {
      col.fields.removeByName('client')
    }
    app.save(col)
  },
)

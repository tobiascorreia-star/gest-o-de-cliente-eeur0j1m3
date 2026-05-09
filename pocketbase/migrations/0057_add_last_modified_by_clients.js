migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clients')
    col.fields.add(
      new RelationField({
        name: 'last_modified_by',
        collectionId: '_pb_users_auth_',
        cascadeDelete: false,
        maxSelect: 1,
        required: false,
      }),
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clients')
    col.fields.removeByName('last_modified_by')
    app.save(col)
  },
)

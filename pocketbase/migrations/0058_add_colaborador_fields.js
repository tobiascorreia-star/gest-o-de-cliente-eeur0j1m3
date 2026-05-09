migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clients')

    if (!col.fields.getByName('colaborador_responsavel')) {
      col.fields.add(new TextField({ name: 'colaborador_responsavel' }))
    }

    if (!col.fields.getByName('colaborador_id')) {
      col.fields.add(
        new RelationField({
          name: 'colaborador_id',
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('clients')
    col.fields.removeByName('colaborador_responsavel')
    col.fields.removeByName('colaborador_id')
    app.save(col)
  },
)

migrate(
  (app) => {
    const collection = new Collection({
      name: 'clients',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'cnpj', type: 'text', required: true },
        { name: 'razao_social', type: 'text', required: true },
        { name: 'nome_cliente', type: 'text', required: true },
        {
          name: 'colaborador',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('configurations').id,
          maxSelect: 1,
        },
        {
          name: 'solicitacao',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('configurations').id,
          maxSelect: 1,
        },
        {
          name: 'status',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('configurations').id,
          maxSelect: 1,
        },
        {
          name: 'categoria',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('configurations').id,
          maxSelect: 1,
        },
        {
          name: 'pgto',
          type: 'relation',
          collectionId: app.findCollectionByNameOrId('configurations').id,
          maxSelect: 1,
        },
        { name: 'observacoes', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('clients')
    app.delete(collection)
  },
)

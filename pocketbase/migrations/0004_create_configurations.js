migrate(
  (app) => {
    const collection = new Collection({
      name: 'configurations',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'type', type: 'text', required: true },
        { name: 'name', type: 'text', required: true },
        { name: 'color', type: 'text' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)

    const seeds = [
      { type: 'colaboradores', name: 'Ana Silva', color: '' },
      { type: 'colaboradores', name: 'Carlos Santos', color: '' },
      { type: 'solicitacoes', name: 'Renovação de Contrato', color: '' },
      { type: 'solicitacoes', name: 'Suporte Técnico', color: '' },
      { type: 'statusList', name: 'Em Aberto', color: 'bg-blue-100 text-blue-800' },
      { type: 'statusList', name: 'Em Análise', color: 'bg-yellow-100 text-yellow-800' },
      { type: 'statusList', name: 'Baixa', color: 'bg-green-100 text-green-800' },
      { type: 'categorias', name: 'VIP', color: 'bg-purple-100 text-purple-800' },
      { type: 'categorias', name: 'Regular', color: 'bg-gray-100 text-gray-800' },
      { type: 'pgtoTipos', name: 'Pix', color: '' },
      { type: 'pgtoTipos', name: 'Cartão de Crédito', color: '' },
    ]

    const col = app.findCollectionByNameOrId('configurations')
    for (const s of seeds) {
      const record = new Record(col)
      record.set('type', s.type)
      record.set('name', s.name)
      record.set('color', s.color)
      app.save(record)
    }
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('configurations')
    app.delete(collection)
  },
)

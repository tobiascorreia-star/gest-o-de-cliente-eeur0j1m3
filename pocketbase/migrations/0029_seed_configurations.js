migrate(
  (app) => {
    const configs = app.findCollectionByNameOrId('configurations')

    const toSeed = [
      { type: 'status', name: 'Ativo' },
      { type: 'status', name: 'Inativo' },
      { type: 'status', name: 'Pendente' },

      { type: 'categoria', name: 'Premium' },
      { type: 'categoria', name: 'Standard' },

      { type: 'pgto', name: 'Mensal' },
      { type: 'pgto', name: 'Anual' },
      { type: 'pgto', name: 'Semestral' },

      { type: 'solicitacao', name: 'Nova Venda' },
      { type: 'solicitacao', name: 'Renovação' },
      { type: 'solicitacao', name: 'Suporte' },
    ]

    for (const item of toSeed) {
      const existing = app.findRecordsByFilter(
        'configurations',
        `type = '${item.type}' && name = '${item.name}'`,
        '',
        1,
        0,
      )

      if (!existing || existing.length === 0) {
        const record = new Record(configs)
        record.set('type', item.type)
        record.set('name', item.name)
        record.set('active', true)
        app.save(record)
      }
    }
  },
  (app) => {
    // Empty
  },
)

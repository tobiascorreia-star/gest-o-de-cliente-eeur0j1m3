migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('clients')
    try {
      app.findFirstRecordByData('clients', 'cnpj', '17.477.472/0001-32')
      return
    } catch (_) {}

    const record = new Record(col)
    record.set('razao_social', 'Empresa Auto-preenchida LTDA')
    record.set('cnpj', '17.477.472/0001-32')
    record.set('nome_cliente', 'Tobias Correia')
    record.set('observacoes', 'Teste 01')
    app.save(record)

    app
      .db()
      .newQuery(
        "UPDATE clients SET created = '2026-05-02 12:00:00.000Z' WHERE cnpj = '17.477.472/0001-32'",
      )
      .execute()
  },
  (app) => {
    try {
      const record = app.findFirstRecordByData('clients', 'cnpj', '17.477.472/0001-32')
      app.delete(record)
    } catch (_) {}
  },
)

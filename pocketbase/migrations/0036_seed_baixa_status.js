migrate(
  (app) => {
    const confs = app.findCollectionByNameOrId('configurations')

    // Idempotent check: if a status named 'BAIXA' already exists, skip
    const existing = app.findRecordsByFilter('configurations', "name = 'BAIXA'", '', 1, 0)
    if (existing.length > 0) {
      return
    }

    const record = new Record(confs)
    record.set('type', 'status')
    record.set('name', 'BAIXA')
    record.set('active', true)
    record.set('color', '#ef4444')
    app.save(record)
  },
  (app) => {
    const existing = app.findRecordsByFilter('configurations', "name = 'BAIXA'", '', 1, 0)
    if (existing.length > 0) {
      app.delete(existing[0])
    }
  },
)

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('payroll_settings')
    const now = new Date()
    const startOfMo = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0),
    ).toISOString()
    try {
      app.findFirstRecordByFilter(col.id, 'reference_date = {:d}', { d: startOfMo })
    } catch (_) {
      const record = new Record(col)
      record.set('reference_date', startOfMo)
      record.set('quantity', 10)
      app.save(record)
    }
  },
  (app) => {},
)

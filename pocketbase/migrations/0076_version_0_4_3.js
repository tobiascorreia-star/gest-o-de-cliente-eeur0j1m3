migrate(
  (app) => {
    try {
      const logs = app.findCollectionByNameOrId('audit_logs')
      const record = new Record(logs)
      record.set('action', 'system_update')
      record.set('details', 'Sistema atualizado para a versão v0.4.3 e otimizações aplicadas.')
      app.save(record)
    } catch (err) {
      // ignore if audit_logs doesn't exist
    }
  },
  (app) => {
    // no-op
  },
)

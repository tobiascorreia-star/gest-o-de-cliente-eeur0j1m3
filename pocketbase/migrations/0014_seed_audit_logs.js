migrate(
  (app) => {
    const logs = app.findCollectionByNameOrId('audit_logs')

    let adminId = null
    try {
      const admin = app.findFirstRecordByData('_pb_users_auth_', 'email', 'tobiascorreia@gmail.com')
      adminId = admin.id
    } catch (_) {}

    const seeds = [
      { action: 'Login no sistema', details: 'Autenticação e Sessão', user: adminId },
      { action: 'Atualização de cliente', details: 'Cliente ID: 12345', user: adminId },
      { action: 'Backup automático', details: 'Database rotina semanal', user: null },
    ]

    for (const s of seeds) {
      const record = new Record(logs)
      record.set('action', s.action)
      record.set('details', s.details)
      if (s.user) record.set('user', s.user)
      app.save(record)
    }
  },
  (app) => {
    app.truncateCollection(app.findCollectionByNameOrId('audit_logs'))
  },
)

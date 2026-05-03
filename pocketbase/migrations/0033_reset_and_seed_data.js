migrate(
  (app) => {
    // 1. Database cleanup of transactional data
    app.db().newQuery('DELETE FROM clients').execute()
    app.db().newQuery('DELETE FROM audit_logs').execute()

    // 2. System Credentials - Administrator
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'tobiascorreia@gmail.com')
      admin.setPassword('Skip@Pass')
      admin.set('role', 'admin')
      app.save(admin)
    } catch (_) {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      const admin = new Record(users)
      admin.setEmail('tobiascorreia@gmail.com')
      admin.setPassword('Skip@Pass')
      admin.setVerified(true)
      admin.set('name', 'Administrator')
      admin.set('role', 'admin')
      app.save(admin)
    }

    // 3. System Credentials - Operator
    try {
      const op = app.findAuthRecordByEmail('_pb_users_auth_', 'operador@sistema.com')
      op.setPassword('Skip@Pass')
      op.set('role', 'operator')
      app.save(op)
    } catch (_) {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      const op = new Record(users)
      op.setEmail('operador@sistema.com')
      op.setPassword('Skip@Pass')
      op.setVerified(true)
      op.set('name', 'Operator')
      op.set('role', 'operator')
      app.save(op)
    }

    // 4. Essential Data Seeding - configurations
    app.db().newQuery('DELETE FROM configurations').execute()

    const confCol = app.findCollectionByNameOrId('configurations')
    const confs = [
      { type: 'Status', name: 'Ativo', color: '#3b82f6', active: true },
      { type: 'Status', name: 'Pendente', color: '#f59e0b', active: true },
      { type: 'Status', name: 'Baixa', color: '#10b981', active: true },
      { type: 'Status', name: 'Concluído', color: '#059669', active: true },
      { type: 'Categoria', name: 'Bronze', color: '#cd7f32', active: true },
      { type: 'Categoria', name: 'Prata', color: '#c0c0c0', active: true },
      { type: 'Categoria', name: 'Ouro', color: '#ffd700', active: true },
    ]

    for (const c of confs) {
      const rec = new Record(confCol)
      rec.set('type', c.type)
      rec.set('name', c.name)
      rec.set('color', c.color)
      rec.set('active', c.active)
      app.save(rec)
    }

    // 5. Alert Settings
    app.db().newQuery('DELETE FROM alert_settings').execute()

    const alertCol = app.findCollectionByNameOrId('alert_settings')
    const alertRec = new Record(alertCol)
    alertRec.set('moderate_threshold', 3)
    alertRec.set('critical_threshold', 7)
    alertRec.set('old_days', 30)
    alertRec.set('critical_days', 15)
    app.save(alertRec)
  },
  (app) => {
    // Down migration not applicable since reset is destructive
  },
)

migrate(
  (app) => {
    // 1. Update administrator password to the new secure credential
    try {
      const admin = app.findAuthRecordByEmail('users', 'tobiascorreia@gmail.com')
      admin.setPassword('Fui3G35')
      app.save(admin)
    } catch (_) {
      // Admin user not found, skip
    }

    // 2. Clear all existing records from business collections
    const collectionsToCheck = [
      'clientes',
      'clients',
      'historico',
      'history',
      'auditoria',
      'audit',
      'colaboradores',
      'solicitacoes',
      'status',
      'categorias',
      'pgto_tipos',
      'alert_config',
      'concluidos',
      'arquivos',
      'relatorios',
    ]

    for (const name of collectionsToCheck) {
      try {
        const col = app.findCollectionByNameOrId(name)
        app.truncateCollection(col)
      } catch (_) {
        // Collection doesn't exist, ignore
      }
    }
  },
  (app) => {
    // Revert administrator password to previous state if possible
    try {
      const admin = app.findAuthRecordByEmail('users', 'tobiascorreia@gmail.com')
      admin.setPassword('12345678')
      app.save(admin)
    } catch (_) {
      // Admin user not found, skip
    }
  },
)

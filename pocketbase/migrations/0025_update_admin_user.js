migrate((app) => {
  const users = app.findCollectionByNameOrId('users')

  try {
    // Tenta encontrar o usuário para atualizar e garantir a role correta
    const record = app.findAuthRecordByEmail('users', 'tobias@megafllex.com')
    record.setPassword('Fui3G35@')
    record.set('role', 'admin')
    record.set('active', true)
    app.save(record)
  } catch (_) {
    // Se o usuário não existir, cria o registro do administrador
    const record = new Record(users)
    record.setEmail('tobias@megafllex.com')
    record.setPassword('Fui3G35@')
    record.setVerified(true)
    record.set('role', 'admin')
    record.set('active', true)
    record.set('name', 'Tobias')
    app.save(record)
  }
})

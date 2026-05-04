onRecordCreateRequest((e) => {
  e.next()
  const log = new Record($app.findCollectionByNameOrId('audit_logs'))
  log.set('action', 'Cliente Criado')
  if (e.auth) {
    log.set('user', e.auth.id)
  }
  log.set('details', `O cliente '${e.record.getString('nome_cliente')}' foi cadastrado.`)
  $app.save(log)
}, 'clients')

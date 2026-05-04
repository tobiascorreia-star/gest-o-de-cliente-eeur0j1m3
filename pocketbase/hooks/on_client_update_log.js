onRecordUpdateRequest((e) => {
  const original = e.record.original()
  let changes = []
  const fields = [
    'cnpj',
    'razao_social',
    'nome_cliente',
    'colaborador',
    'solicitacao',
    'status',
    'categoria',
    'pgto',
    'observacoes',
  ]

  for (let f of fields) {
    if (original.getString(f) !== e.record.getString(f)) {
      changes.push(f)
    }
  }

  e.next()

  if (changes.length > 0) {
    const log = new Record($app.findCollectionByNameOrId('audit_logs'))
    log.set('action', 'Cliente Atualizado')
    if (e.auth) {
      log.set('user', e.auth.id)
    }
    log.set(
      'details',
      `O cliente '${e.record.getString('nome_cliente')}' teve os campos atualizados: ${changes.join(', ')}.`,
    )
    $app.save(log)
  }
}, 'clients')

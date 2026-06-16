onRecordCreateRequest((e) => {
  const colaborador = e.record.getString('colaborador')
  const mes = e.record.getInt('mes_referencia')
  const ano = e.record.getInt('ano_referencia')

  if (!colaborador || !mes || !ano) {
    throw new BadRequestError('Os campos Colaborador, Mês e Ano são obrigatórios.')
  }

  try {
    const existing = $app.findFirstRecordByFilter(
      'payroll',
      `colaborador = '${colaborador}' && mes_referencia = ${mes} && ano_referencia = ${ano}`,
    )
    if (existing) {
      throw new BadRequestError('Já existe um lançamento para este colaborador neste mês.')
    }
  } catch (err) {
    if (err.name === 'BadRequestError') throw err
    // If it's a "sql: no rows in result set" error, it's safe to proceed.
  }

  if (e.record.getBool('closed') && e.record.getString('status') === 'pendente') {
    throw new BadRequestError('Não é possível fechar um lançamento com status pendente.')
  }

  e.next()
}, 'payroll')

onRecordUpdateRequest((e) => {
  const original = e.record.original()
  if (original) {
    const wasClosed = original.getBool('closed')
    const isClosed = e.record.getBool('closed')

    if (wasClosed && isClosed) {
      throw new BadRequestError('Não é possível editar um lançamento de folha já fechado.')
    }
  }

  if (e.record.getBool('closed') && e.record.getString('status') === 'pendente') {
    throw new BadRequestError('Não é possível fechar um lançamento com status pendente.')
  }

  e.next()
}, 'payroll')

onRecordDeleteRequest((e) => {
  const isClosed = e.record.getBool('closed')
  if (isClosed) {
    throw new BadRequestError('Não é possível excluir um lançamento de folha já fechado.')
  }
  e.next()
}, 'payroll')

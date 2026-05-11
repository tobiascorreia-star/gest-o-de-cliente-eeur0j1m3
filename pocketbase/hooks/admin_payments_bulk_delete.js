routerAdd(
  'POST',
  '/backend/v1/admin-payments/bulk-delete',
  (e) => {
    if (e.auth?.getString('role') !== 'admin') return e.forbiddenError('Apenas admins')

    const body = e.requestInfo().body || {}
    const mes = Number(body.mes)
    const ano = Number(body.ano)

    if (!mes || !ano) return e.badRequestError('Mês e ano obrigatórios')

    const records = $app.findRecordsByFilter(
      'admin_payments',
      `mes_referencia = {:mes} && ano_referencia = {:ano}`,
      '',
      0,
      0,
      { mes, ano },
    )

    $app.runInTransaction((txApp) => {
      for (const record of records) {
        txApp.delete(record)
      }
    })

    return e.json(200, { success: true, count: records.length })
  },
  $apis.requireAuth(),
)

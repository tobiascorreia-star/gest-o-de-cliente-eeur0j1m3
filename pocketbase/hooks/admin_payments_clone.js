routerAdd(
  'POST',
  '/backend/v1/admin-payments/clone',
  (e) => {
    if (e.auth?.getString('role') !== 'admin') {
      return e.forbiddenError('Only admins can clone payments')
    }

    const body = e.requestInfo().body
    const mes = Number(body.mes)
    const ano = Number(body.ano)
    if (!mes || !ano) return e.badRequestError('mes and ano are required')

    const exactRecords = $app.findRecordsByFilter(
      'admin_payments',
      'mes_referencia = {:m} && ano_referencia = {:a}',
      '',
      1000,
      0,
      { m: mes, a: ano },
    )

    let nextMes = mes + 1
    let nextAno = ano
    if (nextMes > 12) {
      nextMes = 1
      nextAno = ano + 1
    }

    $app.runInTransaction((txApp) => {
      const col = txApp.findCollectionByNameOrId('admin_payments')
      for (const rec of exactRecords) {
        const newRec = new Record(col)
        newRec.set('descricao', rec.getString('descricao'))
        newRec.set('dono_pagamento', rec.getString('dono_pagamento'))
        newRec.set('observacao', rec.getString('observacao'))
        newRec.set('status', false)
        newRec.set('mes_referencia', nextMes)
        newRec.set('ano_referencia', nextAno)
        newRec.set('admin', e.auth.id)

        const notifStr = rec.getString('data_notificacao')
        if (notifStr) {
          const notifD = new Date(notifStr.replace(' ', 'T'))
          notifD.setUTCMonth(notifD.getUTCMonth() + 1)
          newRec.set('data_notificacao', notifD.toISOString().replace('T', ' '))
        }

        txApp.save(newRec)
      }
    })

    return e.json(200, { success: true, cloned: exactRecords.length })
  },
  $apis.requireAuth(),
)

routerAdd(
  'POST',
  '/backend/v1/admin-payments/clone',
  (e) => {
    if (e.auth?.getString('role') !== 'admin') {
      return e.forbiddenError('Only admins can clone payments')
    }

    const body = e.requestInfo().body
    const sourceMonthStr = body.source_month
    if (!sourceMonthStr) return e.badRequestError('source_month is required')

    const dStart = new Date(sourceMonthStr)
    const startStr = dStart.toISOString().replace('T', ' ')

    const dEnd = new Date(dStart)
    dEnd.setUTCMonth(dEnd.getUTCMonth() + 1)
    const endStr = dEnd.toISOString().replace('T', ' ')

    const exactRecords = $app.findRecordsByFilter(
      'admin_payments',
      'reference_month >= {:s} && reference_month < {:e}',
      '',
      1000,
      0,
      { s: startStr, e: endStr },
    )

    $app.runInTransaction((txApp) => {
      const col = txApp.findCollectionByNameOrId('admin_payments')
      for (const rec of exactRecords) {
        const newRec = new Record(col)
        newRec.set('name', rec.getString('name'))
        newRec.set('value', rec.get('value'))
        newRec.set('observation', rec.getString('observation'))
        newRec.set('status', false)

        const refStr = rec.getString('reference_month')
        const refD = new Date(refStr.replace(' ', 'T'))
        refD.setUTCMonth(refD.getUTCMonth() + 1)
        newRec.set('reference_month', refD.toISOString().replace('T', ' '))

        newRec.set('admin', e.auth.id)

        const dueStr = rec.getString('due_date')
        if (dueStr) {
          const dueD = new Date(dueStr.replace(' ', 'T'))
          dueD.setUTCMonth(dueD.getUTCMonth() + 1)
          newRec.set('due_date', dueD.toISOString().replace('T', ' '))
        }

        txApp.save(newRec)
      }
    })

    return e.json(200, { success: true, cloned: exactRecords.length })
  },
  $apis.requireAuth(),
)

routerAdd(
  'POST',
  '/backend/v1/password-reset-resolve',
  (e) => {
    if (!e.auth || e.auth.getString('role') !== 'admin') {
      return e.forbiddenError(
        'Apenas administradores podem resolver solicitações de redefinição de senha',
      )
    }

    const body = e.requestInfo().body
    const logId = body.id
    if (!logId) return e.badRequestError('ID is required')

    const record = $app.findRecordById('audit_logs', logId)
    const details = record.getString('details')
    if (!details.includes('[RESOLVIDO]')) {
      record.set('details', details + ' [RESOLVIDO]')
      $app.save(record)
    }

    return e.json(200, { success: true })
  },
  $apis.requireAuth(),
)

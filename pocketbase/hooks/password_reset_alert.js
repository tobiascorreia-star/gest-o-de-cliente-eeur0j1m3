routerAdd('POST', '/backend/v1/password-reset-alert', (e) => {
  const body = e.requestInfo().body
  const email = body.email
  if (!email) {
    return e.badRequestError('Email is required')
  }

  const col = $app.findCollectionByNameOrId('audit_logs')
  const record = new Record(col)
  record.set('action', 'password_reset_request')
  record.set('details', `E-mail: ${email} | Solicitado em: ${new Date().toISOString()}`)

  try {
    const user = $app.findAuthRecordByEmail('users', email)
    if (user) {
      record.set('user', user.id)
    }
  } catch (_) {
    // User not found, just log the action without relations
  }

  $app.save(record)

  return e.json(200, { success: true })
})

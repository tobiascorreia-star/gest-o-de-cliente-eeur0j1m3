routerAdd('POST', '/backend/v1/password-reset-alert', (e) => {
  const body = e.requestInfo().body
  const email = body.email
  if (!email) {
    return e.badRequestError('Email is required')
  }

  let user
  try {
    user = $app.findAuthRecordByEmail('users', email)
  } catch (_) {
    // Return success to avoid email enumeration, but do not create notification if user is not found
    return e.json(200, { success: true })
  }

  const notifCol = $app.findCollectionByNameOrId('notifications')
  const notifRecord = new Record(notifCol)
  notifRecord.set('user', user.id)
  notifRecord.set('type', 'password_reset')
  notifRecord.set('resolved', false)

  $app.save(notifRecord)

  return e.json(200, { success: true })
})

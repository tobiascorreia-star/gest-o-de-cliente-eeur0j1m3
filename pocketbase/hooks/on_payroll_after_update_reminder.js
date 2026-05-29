onRecordAfterUpdateSuccess((e) => {
  const record = e.record
  const mes = record.getInt('mes_referencia')
  const ano = record.getInt('ano_referencia')
  const colabId = record.getString('colaborador')

  let colabName = ''
  try {
    const colab = $app.findRecordById('users', colabId)
    colabName = colab.getString('name')
  } catch (_) {}

  const typeVal = `payroll_education_reminder|${mes}|${ano}|${colabName}`

  let admins = []
  try {
    admins = $app.findRecordsByFilter('users', "role = 'admin'", '-created', 100, 0)
  } catch (_) {}

  for (const admin of admins) {
    let exists = false
    try {
      const pending = $app.findRecordsByFilter(
        'notifications',
        "user = '" + admin.id + "' && resolved = false",
        '-created',
        100,
        0,
      )
      for (const r of pending) {
        if (r.getString('type') === typeVal) {
          exists = true
          break
        }
      }
    } catch (_) {}

    if (!exists) {
      const notifications = $app.findCollectionByNameOrId('notifications')
      const notif = new Record(notifications)
      notif.set('user', admin.id)
      notif.set('type', typeVal)
      notif.set('resolved', false)
      $app.save(notif)
    }
  }

  e.next()
}, 'payroll')

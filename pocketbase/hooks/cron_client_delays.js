cronAdd('check_client_delays', '*/15 * * * *', () => {
  try {
    const alertSettings = $app.findFirstRecordByFilter('alert_settings', "id != ''")
    const oldDays = alertSettings.getInt('old_days')
    const criticalDays = alertSettings.getInt('critical_days')
    const thresholdDays = oldDays > 0 ? oldDays : criticalDays > 0 ? criticalDays : 0

    if (thresholdDays <= 0) return

    const now = new Date()
    now.setDate(now.getDate() - thresholdDays)
    const targetDate = now.toISOString().replace('T', ' ').substring(0, 19) + 'Z'

    const configs = $app.findRecordsByFilter('configurations', "type='STATUS'", '', 100, 0)
    let excludeStatuses = []
    for (let c of configs) {
      let name = c.getString('name').toUpperCase()
      if (name === 'BAIXA' || name === 'CONCLUÍDO' || name === 'CONCLUIDO') {
        excludeStatuses.push(c.id)
      }
    }

    let filter = `updated <= {:targetDate}`
    let bindParams = { targetDate: targetDate }

    if (excludeStatuses.length > 0) {
      filter += ` && status != '` + excludeStatuses.join(`' && status != '`) + `'`
    }

    const delayedClients = $app.findRecordsByFilter(
      'clients',
      filter,
      '-updated',
      1000,
      0,
      bindParams,
    )
    if (delayedClients.length === 0) return

    const admins = $app.findRecordsByFilter('users', "role='admin'", '', 100, 0)

    $app.runInTransaction((txApp) => {
      const notifCol = txApp.findCollectionByNameOrId('notifications')
      for (let client of delayedClients) {
        for (let admin of admins) {
          const existing = txApp.findRecordsByFilter(
            'notifications',
            "type='atraso_cliente' && client={:client} && user={:user} && (resolved=false || created > {:updated})",
            '',
            1,
            0,
            {
              client: client.id,
              user: admin.id,
              updated: client.getString('updated'),
            },
          )

          if (existing.length === 0) {
            const notif = new Record(notifCol)
            notif.set('user', admin.id)
            notif.set('type', 'atraso_cliente')
            notif.set('client', client.id)
            notif.set('resolved', false)
            txApp.save(notif)
          }
        }
      }
    })
  } catch (err) {
    $app.logger().error('Cron check_client_delays error', 'error', err.message)
  }
})

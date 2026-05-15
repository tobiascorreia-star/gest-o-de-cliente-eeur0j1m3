cronAdd('check_client_delays', '*/15 * * * *', () => {
  try {
    const alertSettings = $app.findFirstRecordByFilter('alert_settings', "id != ''")
    const oldDays = alertSettings.getInt('old_days')
    const criticalDays = alertSettings.getInt('critical_days')
    const thresholdDays = oldDays > 0 ? oldDays : criticalDays > 0 ? criticalDays : 0

    if (thresholdDays <= 0) return

    const now = new Date()

    const configs = $app.findRecordsByFilter('configurations', "type='STATUS'", '', 100, 0)
    let excludeStatuses = []
    let aguardandoAtencaoStatuses = []
    for (let c of configs) {
      let name = c.getString('name').toUpperCase()
      if (name === 'BAIXA' || name === 'CONCLUÍDO' || name === 'CONCLUIDO') {
        excludeStatuses.push(c.id)
      }
      if (name === 'AGUARDANDO' || name === 'ATENÇÃO' || name === 'ATENCAO') {
        aguardandoAtencaoStatuses.push(c.id)
      }
    }

    let filter = `1=1`
    if (excludeStatuses.length > 0) {
      filter += ` && status != '` + excludeStatuses.join(`' && status != '`) + `'`
    }

    const pendingClients = $app.findRecordsByFilter('clients', filter, '-updated', 1000, 0, {})

    let delayedClients = []
    for (let client of pendingClients) {
      const updatedStr = client.getString('updated')
      if (!updatedStr) continue

      const updatedDate = new Date(updatedStr)
      const nowMs = now.getTime()
      const updatedMs = updatedDate.getTime()
      const daysSince = Math.floor((nowMs - updatedMs) / (1000 * 60 * 60 * 24))
      const isMonthTurnover =
        now.getMonth() !== updatedDate.getMonth() || now.getFullYear() !== updatedDate.getFullYear()

      const statusId = client.getString('status')
      const isAguardandoAtencao = aguardandoAtencaoStatuses.includes(statusId)

      let isDelayed = false
      if (isAguardandoAtencao && (daysSince > criticalDays || isMonthTurnover)) {
        isDelayed = true
      } else if (daysSince > oldDays) {
        isDelayed = true
      }

      if (isDelayed) {
        delayedClients.push(client)
      }
    }

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

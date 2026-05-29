cronAdd('check_client_delays', '*/15 * * * *', () => {
  try {
    const alertSettings = $app.findFirstRecordByFilter('alert_settings', "id != ''")
    const oldDays = alertSettings.getInt('old_days')
    const criticalDays = alertSettings.getInt('critical_days')
    const oldAdminDays = alertSettings.getInt('old_admin_days')

    const now = new Date()

    const configs = $app.findRecordsByFilter(
      'configurations',
      "type='STATUS' || type='PGTO'",
      '',
      100,
      0,
    )
    let excludeStatuses = []
    let aguardandoAtencaoStatuses = []
    let aguardandoStatuses = []
    let abertoPgtoId = null
    let aPagarPgtoId = null

    for (let c of configs) {
      let type = c.getString('type')
      let name = c.getString('name').toUpperCase()

      if (type === 'STATUS') {
        if (name === 'BAIXA' || name === 'CONCLUÍDO' || name === 'CONCLUIDO') {
          excludeStatuses.push(c.id)
        }
        if (name === 'AGUARDANDO' || name === 'ATENÇÃO' || name === 'ATENCAO') {
          aguardandoAtencaoStatuses.push(c.id)
          if (name === 'AGUARDANDO') {
            aguardandoStatuses.push(c.id)
          }
        }
      }
      if (type === 'PGTO') {
        if (name === 'ABERTO') {
          abertoPgtoId = c.id
        }
        if (name === 'A PAGAR') {
          aPagarPgtoId = c.id
        }
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

      const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const endOfMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      const daysToMonthEnd = Math.round(
        (endOfMonthDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24),
      )

      const statusId = client.getString('status')
      const pgtoId = client.getString('pgto')

      const isAguardandoAtencao = aguardandoAtencaoStatuses.includes(statusId)
      const isAguardando = aguardandoStatuses.includes(statusId)
      const isAberto = pgtoId === abertoPgtoId
      const isAPagar = pgtoId === aPagarPgtoId

      let isDelayed = false

      // Regra 04: End of month (only for A Pagar) - last 3 days
      if (isAPagar && daysToMonthEnd <= 3) {
        isDelayed = true
      }
      // Regra 02: Critical days (only for Aguardando or Atenção)
      else if (isAguardandoAtencao && criticalDays > 0 && daysSince > criticalDays) {
        isDelayed = true
      }
      // Regra 01: Moderate (only for Aguardando)
      else if (isAguardando && oldDays > 0 && daysSince > oldDays) {
        isDelayed = true
      }
      // Regra 03: Old Admin (only for Pgto Aberto)
      else if (isAberto && oldAdminDays > 0 && daysSince > oldAdminDays) {
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

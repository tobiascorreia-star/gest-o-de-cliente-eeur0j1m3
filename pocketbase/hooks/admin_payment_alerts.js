cronAdd('admin_payment_alerts', '0 9 * * *', () => {
  const today = new Date()
  // Format locally to prevent UTC date shifts (e.g., May 5th becoming May 4th at midnight)
  const yyyy = today.getFullYear()
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const dd = String(today.getDate()).padStart(2, '0')
  const todayEndStr = `${yyyy}-${mm}-${dd} 23:59:59.999Z`

  const records = $app.findRecordsByFilter(
    'admin_payments',
    "status = false && data_notificacao != '' && data_notificacao <= {:today}",
    '',
    0,
    0,
    { today: todayEndStr },
  )

  if (records.length > 0) {
    $app.logger().info('Admin Payment Alerts triggered', 'count', records.length)
    const notifCol = $app.findCollectionByNameOrId('notifications')

    $app.runInTransaction((txApp) => {
      for (const rec of records) {
        const adminId = rec.getString('admin')
        if (!adminId) continue

        const existing = txApp.findRecordsByFilter(
          'notifications',
          "user = {:admin} && type = 'admin_payment_alert' && resolved = false",
          '',
          1,
          0,
          { admin: adminId },
        )

        if (existing.length === 0) {
          const notif = new Record(notifCol)
          notif.set('user', adminId)
          notif.set('type', 'admin_payment_alert')
          notif.set('resolved', false)
          txApp.save(notif)
        }
      }
    })
  }
})

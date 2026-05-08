onRecordAfterUpdateSuccess((e) => {
  try {
    const notifs = $app.findRecordsByFilter(
      'notifications',
      "type='atraso_cliente' && client={:client} && resolved=false",
      '',
      100,
      0,
      { client: e.record.id },
    )
    for (let notif of notifs) {
      notif.set('resolved', true)
      $app.save(notif)
    }
  } catch (err) {
    $app.logger().error('Error auto-resolving client delays', 'error', err.message)
  }
  e.next()
}, 'clients')

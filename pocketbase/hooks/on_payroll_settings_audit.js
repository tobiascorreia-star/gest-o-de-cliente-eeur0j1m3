onRecordAfterCreateSuccess((e) => {
  try {
    const adminId = e.requestInfo()?.auth?.id || 'system'
    const qty = e.record.getFloat('quantity')
    const ref = e.record.getString('reference_date')
    const auditCol = $app.findCollectionByNameOrId('audit_logs')
    const log = new Record(auditCol)
    log.set('action', 'PAYROLL_SETTINGS_CREATED')
    log.set('user', adminId === 'system' ? '' : adminId)
    log.set('details', `Configuração da folha criada para ${ref}. Quantidade Global: ${qty}`)
    $app.save(log)
  } catch (err) {
    $app.logger().error('Audit log error: ' + err)
  }
  e.next()
}, 'payroll_settings')

onRecordAfterUpdateSuccess((e) => {
  try {
    const adminId = e.requestInfo()?.auth?.id || 'system'
    const qty = e.record.getFloat('quantity')
    const ref = e.record.getString('reference_date')
    const auditCol = $app.findCollectionByNameOrId('audit_logs')
    const log = new Record(auditCol)
    log.set('action', 'PAYROLL_SETTINGS_UPDATED')
    log.set('user', adminId === 'system' ? '' : adminId)
    log.set(
      'details',
      `Configuração da folha atualizada para ${ref}. Nova Quantidade Global: ${qty}`,
    )
    $app.save(log)
  } catch (err) {
    $app.logger().error('Audit log error: ' + err)
  }
  e.next()
}, 'payroll_settings')

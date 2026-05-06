onRecordAfterCreateSuccess((e) => {
  try {
    const adminId = e.requestInfo()?.auth?.id || 'system'
    const employeeId = e.record.getString('employee')
    const total = e.record.getFloat('total')

    const auditCol = $app.findCollectionByNameOrId('audit_logs')
    const log = new Record(auditCol)
    log.set('action', 'PAYROLL_CREATED')
    log.set('user', adminId === 'system' ? '' : adminId)
    log.set('details', `Folha de pagamento criada. Colaborador: ${employeeId}. Total: R$ ${total}`)
    $app.save(log)
  } catch (err) {
    $app.logger().error('Error creating audit log for payroll create: ' + err)
  }
  e.next()
}, 'payroll')

onRecordAfterUpdateSuccess((e) => {
  try {
    const adminId = e.requestInfo()?.auth?.id || 'system'
    const employeeId = e.record.getString('employee')
    const total = e.record.getFloat('total')

    const oldClosed = e.record.original().getBool('closed')
    const newClosed = e.record.getBool('closed')

    const auditCol = $app.findCollectionByNameOrId('audit_logs')
    const log = new Record(auditCol)

    if (!oldClosed && newClosed) {
      log.set('action', 'PAYROLL_CLOSED')
      log.set('user', adminId === 'system' ? '' : adminId)
      log.set(
        'details',
        `Folha de pagamento fechada. Colaborador: ${employeeId}. Total: R$ ${total}`,
      )
    } else {
      log.set('action', 'PAYROLL_UPDATED')
      log.set('user', adminId === 'system' ? '' : adminId)
      log.set(
        'details',
        `Folha de pagamento atualizada. Colaborador: ${employeeId}. Novo Total: R$ ${total}`,
      )
    }
    $app.save(log)
  } catch (err) {
    $app.logger().error('Error creating audit log for payroll update: ' + err)
  }
  e.next()
}, 'payroll')

onRecordAfterDeleteSuccess((e) => {
  try {
    const adminId = e.requestInfo()?.auth?.id || 'system'
    const employeeId = e.record.getString('employee')

    const auditCol = $app.findCollectionByNameOrId('audit_logs')
    const log = new Record(auditCol)
    log.set('action', 'PAYROLL_DELETED')
    log.set('user', adminId === 'system' ? '' : adminId)
    log.set('details', `Folha de pagamento excluída. Colaborador: ${employeeId}.`)
    $app.save(log)
  } catch (err) {
    $app.logger().error('Error creating audit log for payroll delete: ' + err)
  }
  e.next()
}, 'payroll')

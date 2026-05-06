migrate(
  (app) => {
    const users = app.findRecordsByFilter('_pb_users_auth_', '1=1', '', 2, 0)
    if (users.length === 0) return

    const payrollCol = app.findCollectionByNameOrId('payroll')

    users.forEach((u, i) => {
      try {
        app.findFirstRecordByFilter('payroll', 'employee = {:id}', { id: u.id })
      } catch (_) {
        const record = new Record(payrollCol)
        record.set('employee', u.id)
        record.set('base_salary', 2000 + i * 500)
        record.set('install_commission', 150)
        record.set('bonus', 100)
        record.set('extra_1', 0)
        record.set('extra_2', 0)
        record.set('extra_3', 0)
        record.set('extra_4', 0)
        record.set('total', 2000 + i * 500 + 150 + 100)
        record.set('reference_date', new Date().toISOString().split('T')[0] + ' 12:00:00.000Z')
        record.set('status', i === 0 ? 'Pago' : 'Pendente')
        app.save(record)
      }
    })
  },
  (app) => {
    const payrollCol = app.findCollectionByNameOrId('payroll')
    app.truncateCollection(payrollCol)
  },
)

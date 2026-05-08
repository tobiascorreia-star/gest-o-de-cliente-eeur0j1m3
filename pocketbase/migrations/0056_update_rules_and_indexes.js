migrate(
  (app) => {
    // notifications rules & index
    const notifications = app.findCollectionByNameOrId('notifications')
    notifications.listRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || user = @request.auth.id)"
    notifications.viewRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || user = @request.auth.id)"
    notifications.addIndex('idx_notifications_user', false, 'user', '')
    app.save(notifications)

    // clients rules
    const clients = app.findCollectionByNameOrId('clients')
    clients.listRule = "@request.auth.id != '' && @request.auth.active = true"
    clients.viewRule = "@request.auth.id != '' && @request.auth.active = true"
    clients.createRule = "@request.auth.id != '' && @request.auth.active = true"
    clients.updateRule = "@request.auth.id != '' && @request.auth.active = true"
    clients.deleteRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    app.save(clients)

    // admin_payments index
    const adminPayments = app.findCollectionByNameOrId('admin_payments')
    adminPayments.addIndex('idx_admin_payments_admin', false, 'admin', '')
    app.save(adminPayments)

    // payroll index
    const payroll = app.findCollectionByNameOrId('payroll')
    payroll.addIndex('idx_payroll_emp_ref', false, 'employee, reference_date', '')
    app.save(payroll)
  },
  (app) => {
    const notifications = app.findCollectionByNameOrId('notifications')
    notifications.listRule = "@request.auth.role = 'admin'"
    notifications.viewRule = "@request.auth.role = 'admin'"
    notifications.removeIndex('idx_notifications_user')
    app.save(notifications)

    const clients = app.findCollectionByNameOrId('clients')
    clients.listRule = "@request.auth.id != ''"
    clients.viewRule = "@request.auth.id != ''"
    clients.createRule = "@request.auth.id != ''"
    clients.updateRule = "@request.auth.id != ''"
    clients.deleteRule = "@request.auth.id != ''"
    app.save(clients)

    const adminPayments = app.findCollectionByNameOrId('admin_payments')
    adminPayments.removeIndex('idx_admin_payments_admin')
    app.save(adminPayments)

    const payroll = app.findCollectionByNameOrId('payroll')
    payroll.removeIndex('idx_payroll_emp_ref')
    app.save(payroll)
  },
)

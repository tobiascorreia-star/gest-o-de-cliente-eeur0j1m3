migrate(
  (app) => {
    const adminPayments = app.findCollectionByNameOrId('admin_payments')
    adminPayments.addIndex('idx_admin_payments_archived', false, 'archived', '')
    adminPayments.addIndex('idx_admin_payments_status_notif', false, 'status, data_notificacao', '')
    adminPayments.addIndex(
      'idx_admin_payments_ref_dono_arch',
      false,
      'ano_referencia, mes_referencia, dono_pagamento, archived',
      '',
    )
    app.save(adminPayments)

    const clients = app.findCollectionByNameOrId('clients')
    clients.addIndex('idx_clients_nome', false, 'nome_cliente', '')
    clients.addIndex('idx_clients_created', false, 'created', '')
    app.save(clients)
  },
  (app) => {
    const adminPayments = app.findCollectionByNameOrId('admin_payments')
    adminPayments.removeIndex('idx_admin_payments_archived')
    adminPayments.removeIndex('idx_admin_payments_status_notif')
    adminPayments.removeIndex('idx_admin_payments_ref_dono_arch')
    app.save(adminPayments)

    const clients = app.findCollectionByNameOrId('clients')
    clients.removeIndex('idx_clients_nome')
    clients.removeIndex('idx_clients_created')
    app.save(clients)
  },
)

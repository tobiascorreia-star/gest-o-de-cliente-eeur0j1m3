migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('admin_payments')
    col.addIndex(
      'idx_admin_payments_ref_dono',
      false,
      'ano_referencia, mes_referencia, dono_pagamento',
      '',
    )
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('admin_payments')
    col.removeIndex('idx_admin_payments_ref_dono')
    app.save(col)
  },
)

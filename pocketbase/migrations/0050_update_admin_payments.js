migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('admin_payments')

    // Clear existing data to apply new schema safely
    app.db().newQuery('DELETE FROM admin_payments').execute()

    col.fields.add(new TextField({ name: 'dono_pagamento', required: true }))
    col.fields.add(new TextField({ name: 'descricao', required: true }))
    col.fields.add(new DateField({ name: 'data_notificacao', required: true }))
    col.fields.add(new DateField({ name: 'data_pagamento_realizado' }))
    col.fields.add(new TextField({ name: 'observacao' }))
    col.fields.add(new NumberField({ name: 'mes_referencia', required: true }))
    col.fields.add(new NumberField({ name: 'ano_referencia', required: true }))

    col.fields.removeByName('name')
    col.fields.removeByName('due_date')
    col.fields.removeByName('value')
    col.fields.removeByName('observation')
    col.fields.removeByName('reference_month')

    col.removeIndex('idx_admin_payments_ref_month')
    col.addIndex('idx_admin_payments_ref', false, 'ano_referencia, mes_referencia', '')

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('admin_payments')
    // Cannot safely revert dropped fields without data loss
  },
)

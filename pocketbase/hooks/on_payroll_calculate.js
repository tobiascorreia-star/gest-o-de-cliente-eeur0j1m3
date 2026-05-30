onRecordCreate((e) => {
  const isManual = e.record.getBool('manual_install_qty')

  let comm = e.record.getFloat('incentivo')
  if (!comm && comm !== 0) {
    comm = e.record.getFloat('install_commission')
  }

  if (!isManual) {
    const unit = e.record.getFloat('unit_value')
    const qtde = e.record.getFloat('qtde_install')
    comm = unit * qtde
  }

  e.record.set('install_commission', comm)
  e.record.set('incentivo', comm)

  const base = e.record.getFloat('base_salary')
  const bonus = e.record.getFloat('bonus')
  const ex1 = e.record.getFloat('extra_1')
  const ex2 = e.record.getFloat('extra_2')
  const ex3 = e.record.getFloat('extra_3')
  const ex4 = e.record.getFloat('extra_4')
  const desconto = e.record.getFloat('desconto')

  const total = base + comm + bonus + ex1 + ex2 + ex3 + ex4 - desconto
  e.record.set('total_a_pagar', total)

  e.next()
}, 'payroll')

onRecordUpdate((e) => {
  const isManual = e.record.getBool('manual_install_qty')

  let comm = e.record.getFloat('incentivo')
  if (!comm && comm !== 0) {
    comm = e.record.getFloat('install_commission')
  }

  if (!isManual) {
    const unit = e.record.getFloat('unit_value')
    const qtde = e.record.getFloat('qtde_install')
    comm = unit * qtde
  }

  e.record.set('install_commission', comm)
  e.record.set('incentivo', comm)

  const base = e.record.getFloat('base_salary')
  const bonus = e.record.getFloat('bonus')
  const ex1 = e.record.getFloat('extra_1')
  const ex2 = e.record.getFloat('extra_2')
  const ex3 = e.record.getFloat('extra_3')
  const ex4 = e.record.getFloat('extra_4')
  const desconto = e.record.getFloat('desconto')

  const total = base + comm + bonus + ex1 + ex2 + ex3 + ex4 - desconto
  e.record.set('total_a_pagar', total)

  e.next()
}, 'payroll')

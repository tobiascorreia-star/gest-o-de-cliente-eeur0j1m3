onRecordCreate((e) => {
  const isManual = e.record.get('manual_install_qty') === true

  let comm = Number(e.record.get('incentivo')) || Number(e.record.get('install_commission')) || 0

  if (!isManual) {
    const unit = Number(e.record.get('unit_value')) || 0
    const qtde = Number(e.record.get('qtde_install')) || 0
    comm = unit * qtde
    e.record.set('install_commission', comm)
    e.record.set('incentivo', comm)
  } else {
    e.record.set('install_commission', comm)
    e.record.set('incentivo', comm)
  }

  const base = Number(e.record.get('base_salary')) || 0
  const bonus = Number(e.record.get('bonus')) || 0
  const ex1 = Number(e.record.get('extra_1')) || 0
  const ex2 = Number(e.record.get('extra_2')) || 0
  const ex3 = Number(e.record.get('extra_3')) || 0
  const ex4 = Number(e.record.get('extra_4')) || 0

  const total = base + comm + bonus + ex1 + ex2 + ex3 + ex4
  e.record.set('total', total)
  e.next()
}, 'payroll')

onRecordUpdate((e) => {
  const isManual = e.record.get('manual_install_qty') === true

  let comm = Number(e.record.get('incentivo')) || Number(e.record.get('install_commission')) || 0

  if (!isManual) {
    const unit = Number(e.record.get('unit_value')) || 0
    const qtde = Number(e.record.get('qtde_install')) || 0
    comm = unit * qtde
    e.record.set('install_commission', comm)
    e.record.set('incentivo', comm)
  } else {
    e.record.set('install_commission', comm)
    e.record.set('incentivo', comm)
  }

  const base = Number(e.record.get('base_salary')) || 0
  const bonus = Number(e.record.get('bonus')) || 0
  const ex1 = Number(e.record.get('extra_1')) || 0
  const ex2 = Number(e.record.get('extra_2')) || 0
  const ex3 = Number(e.record.get('extra_3')) || 0
  const ex4 = Number(e.record.get('extra_4')) || 0

  const total = base + comm + bonus + ex1 + ex2 + ex3 + ex4
  e.record.set('total', total)
  e.next()
}, 'payroll')

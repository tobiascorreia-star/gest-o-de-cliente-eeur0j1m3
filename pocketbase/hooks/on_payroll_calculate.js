onRecordCreate((e) => {
  const unit = Number(e.record.get('unit_value')) || 0
  const qtde = Number(e.record.get('qtde_install')) || 0
  const comm = unit * qtde
  e.record.set('install_commission', comm)

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
  const unit = Number(e.record.get('unit_value')) || 0
  const qtde = Number(e.record.get('qtde_install')) || 0
  const comm = unit * qtde
  e.record.set('install_commission', comm)

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

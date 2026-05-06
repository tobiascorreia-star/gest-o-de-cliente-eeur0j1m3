onRecordCreate((e) => {
  const base = e.record.getFloat('base_salary') || 0
  const comm = e.record.getFloat('install_commission') || 0
  const bonus = e.record.getFloat('bonus') || 0
  const ex1 = e.record.getFloat('extra_1') || 0
  const ex2 = e.record.getFloat('extra_2') || 0
  const ex3 = e.record.getFloat('extra_3') || 0
  const ex4 = e.record.getFloat('extra_4') || 0

  const total = base + comm + bonus + ex1 + ex2 + ex3 + ex4
  e.record.set('total', total)
  e.next()
}, 'payroll')

onRecordUpdate((e) => {
  const base = e.record.getFloat('base_salary') || 0
  const comm = e.record.getFloat('install_commission') || 0
  const bonus = e.record.getFloat('bonus') || 0
  const ex1 = e.record.getFloat('extra_1') || 0
  const ex2 = e.record.getFloat('extra_2') || 0
  const ex3 = e.record.getFloat('extra_3') || 0
  const ex4 = e.record.getFloat('extra_4') || 0

  const total = base + comm + bonus + ex1 + ex2 + ex3 + ex4
  e.record.set('total', total)
  e.next()
}, 'payroll')

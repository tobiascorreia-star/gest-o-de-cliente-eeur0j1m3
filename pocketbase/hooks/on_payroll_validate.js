onRecordCreateRequest((e) => {
  const employee = e.record.getString('employee')
  const refDate = e.record.getString('reference_date')

  if (employee && refDate) {
    try {
      const d = new Date(refDate)
      const y = d.getUTCFullYear()
      const m = d.getUTCMonth()
      const startOfMo = new Date(Date.UTC(y, m, 1, 0, 0, 0)).toISOString()
      const endOfMo = new Date(Date.UTC(y, m + 1, 1, 0, 0, 0)).toISOString()

      const existing = $app.findFirstRecordByFilter(
        'payroll',
        `employee = '${employee}' && reference_date >= '${startOfMo}' && reference_date < '${endOfMo}'`,
      )
      if (existing) {
        return e.badRequestError('Já existe um lançamento para este colaborador neste mês.')
      }
    } catch (err) {
      // not found, safe to create
    }
  }
  e.next()
}, 'payroll')

onRecordUpdateRequest((e) => {
  const original = e.record.original()
  const wasClosed = original.get('closed') === true || original.get('status') === 'Pago'
  const isClosed = e.record.get('closed') === true || e.record.get('status') === 'Pago'

  if (wasClosed && isClosed) {
    return e.badRequestError('Cannot edit a closed payroll record.')
  }
  e.next()
}, 'payroll')

onRecordDeleteRequest((e) => {
  const isClosed = e.record.get('closed') === true || e.record.get('status') === 'Pago'
  if (isClosed) {
    return e.badRequestError('Cannot delete a closed payroll record.')
  }
  e.next()
}, 'payroll')

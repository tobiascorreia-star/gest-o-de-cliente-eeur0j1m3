onRecordUpdateRequest((e) => {
  const original = e.record.original()
  if (original.getBool('closed')) {
    if (e.record.getBool('closed')) {
      return e.badRequestError('Cannot edit a closed payroll record.')
    }
  }
  e.next()
}, 'payroll')

onRecordDeleteRequest((e) => {
  if (e.record.getBool('closed')) {
    return e.badRequestError('Cannot delete a closed payroll record.')
  }
  e.next()
}, 'payroll')

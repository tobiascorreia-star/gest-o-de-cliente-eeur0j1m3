onRecordAfterCreateSuccess((e) => {
  const userId = e.record.get('user')
  const month = e.record.get('month')
  const year = e.record.get('year')

  if (userId) {
    try {
      // 1. Resolve operator alerts
      const opRecords = $app.findRecordsByFilter(
        'notifications',
        "user = {:user} && (type ~ 'payroll_education' || type ~ 'financial_education') && resolved = false",
        '',
        100,
        0,
        { user: userId },
      )
      for (const r of opRecords) {
        r.set('resolved', true)
        $app.save(r)
      }

      // 2. Resolve admin alerts
      const adminRecords = $app.findRecordsByFilter(
        'notifications',
        "type ~ 'payroll_education_reminder' && resolved = false",
        '',
        1000,
        0,
        {},
      )

      let uName = ''
      try {
        const uRec = $app.findRecordById('users', userId)
        uName = uRec.get('name') || uRec.get('email')
      } catch (err) {}

      for (const r of adminRecords) {
        const t = r.get('type')
        // Expected format: payroll_education_reminder|10|2023|Nome
        const parts = t.split('|')
        if (parts.length >= 3) {
          const m = parseInt(parts[1], 10)
          const y = parseInt(parts[2], 10)
          const namePart = parts[3] || ''

          const isSamePeriod = m === month && y === year
          // If name matches or we just resolve all reminders for this specific month/year/name
          if (isSamePeriod && (!namePart || namePart === uName)) {
            r.set('resolved', true)
            $app.save(r)
          }
        }
      }
    } catch (_) {}
  }
  e.next()
}, 'financial_education')

onRecordAfterUpdateSuccess((e) => {
  const userId = e.record.get('user')
  const month = e.record.get('month')
  const year = e.record.get('year')

  if (userId) {
    try {
      // 1. Resolve operator alerts
      const opRecords = $app.findRecordsByFilter(
        'notifications',
        "user = {:user} && (type ~ 'payroll_education' || type ~ 'financial_education') && resolved = false",
        '',
        100,
        0,
        { user: userId },
      )
      for (const r of opRecords) {
        r.set('resolved', true)
        $app.save(r)
      }

      // 2. Resolve admin alerts
      const adminRecords = $app.findRecordsByFilter(
        'notifications',
        "type ~ 'payroll_education_reminder' && resolved = false",
        '',
        1000,
        0,
        {},
      )

      let uName = ''
      try {
        const uRec = $app.findRecordById('users', userId)
        uName = uRec.get('name') || uRec.get('email')
      } catch (err) {}

      for (const r of adminRecords) {
        const t = r.get('type')
        const parts = t.split('|')
        if (parts.length >= 3) {
          const m = parseInt(parts[1], 10)
          const y = parseInt(parts[2], 10)
          const namePart = parts[3] || ''

          const isSamePeriod = m === month && y === year
          if (isSamePeriod && (!namePart || namePart === uName)) {
            r.set('resolved', true)
            $app.save(r)
          }
        }
      }
    } catch (_) {}
  }
  e.next()
}, 'financial_education')

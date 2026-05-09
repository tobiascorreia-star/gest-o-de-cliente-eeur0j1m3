// Request hook to intercept client updates and protect specific fields for non-admin users
onRecordUpdateRequest((e) => {
  const user = e.auth

  // If the user is not an admin, protect the integrity of creator fields
  if (!user || user.getString('role') !== 'admin') {
    if (e.record && typeof e.record.original === 'function') {
      const original = e.record.original()

      // Restore original values to explicitly ignore any values sent in the payload
      e.record.set('colaborador_id', original.get('colaborador_id'))
      e.record.set('colaborador_responsavel', original.get('colaborador_responsavel'))
      e.record.set('colaborador', original.get('colaborador'))
      e.record.set('created', original.get('created'))
    }
  }

  e.next()
}, 'clients')

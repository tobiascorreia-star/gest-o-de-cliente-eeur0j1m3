routerAdd(
  'PATCH',
  '/backend/v1/users/{id}/admin-update',
  (e) => {
    const auth = e.auth
    if (!auth || auth.getString('role') !== 'admin') {
      throw new ForbiddenError('Apenas administradores podem atualizar outros usuários.')
    }

    const id = e.request.pathValue('id')
    const record = $app.findRecordById('users', id)

    const body = e.requestInfo().body || {}

    if (body.name !== undefined && body.name !== null) record.set('name', String(body.name))
    if (body.email !== undefined && body.email !== null) record.setEmail(String(body.email))
    if (body.emailVisibility !== undefined && body.emailVisibility !== null)
      record.set('emailVisibility', String(body.emailVisibility) === 'true')
    if (body.phone !== undefined && body.phone !== null) record.set('phone', String(body.phone))
    if (body.role !== undefined && body.role !== null) record.set('role', String(body.role))
    if (body.active !== undefined && body.active !== null)
      record.set('active', String(body.active) === 'true')

    const password = body.password != null ? String(body.password).trim() : ''
    const passwordConfirm = body.passwordConfirm != null ? String(body.passwordConfirm).trim() : ''

    if (password !== '') {
      if (password !== passwordConfirm) {
        throw new BadRequestError('As senhas não coincidem.', {
          passwordConfirm: 'As senhas não coincidem.',
        })
      }
      record.setPassword(password)
    }

    const avatars = e.findUploadedFiles('avatar')
    if (avatars && avatars.length > 0) {
      record.set('avatar', avatars[0])
    } else if (body.avatar === '') {
      record.set('avatar', null)
    }

    // Allow PocketBase to handle the validation error internally and respond with 400
    // This prevents generic 500 errors and preserves field-specific error messages
    $app.save(record)

    return e.json(200, record)
  },
  $apis.requireAuth(),
)

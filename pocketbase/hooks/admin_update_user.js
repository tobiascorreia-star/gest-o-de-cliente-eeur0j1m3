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

    if (body.name !== undefined) record.set('name', String(body.name))
    if (body.email !== undefined) record.setEmail(String(body.email))
    if (body.phone !== undefined) record.set('phone', String(body.phone))
    if (body.role !== undefined) record.set('role', String(body.role))
    if (body.active !== undefined) record.set('active', String(body.active) === 'true')

    const password = body.password !== undefined ? String(body.password) : ''
    if (password !== '') {
      const passwordConfirm = body.passwordConfirm !== undefined ? String(body.passwordConfirm) : ''
      if (password !== passwordConfirm) {
        throw new BadRequestError('As senhas não coincidem.', {
          passwordConfirm: new ValidationError('validation_mismatch', 'As senhas não coincidem.'),
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

    $app.save(record)
    return e.json(200, record)
  },
  $apis.requireAuth(),
)

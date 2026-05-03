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

    const getStr = (key) => {
      if (body[key] !== undefined) return String(body[key])
      return e.request.formValue(key)
    }

    const name = getStr('name')
    if (name || name === '') record.set('name', name)

    const email = getStr('email')
    if (email) record.setEmail(email)

    const phone = getStr('phone')
    if (phone || phone === '') record.set('phone', phone)

    const role = getStr('role')
    if (role) record.set('role', role)

    const activeStr = getStr('active')
    if (activeStr) {
      record.set('active', activeStr === 'true')
    }

    const password = getStr('password')
    if (password) {
      const passwordConfirm = getStr('passwordConfirm')
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
    } else if (getStr('avatar') === '') {
      record.set('avatar', null)
    }

    $app.save(record)
    return e.json(200, record)
  },
  $apis.requireAuth(),
)

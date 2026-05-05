routerAdd(
  'PATCH',
  '/backend/v1/users/{id}/admin-update',
  (e) => {
    try {
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
      const passwordConfirm =
        body.passwordConfirm != null ? String(body.passwordConfirm).trim() : ''

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

      // Validates and saves the record. If validation fails, it throws an error that is caught below.
      $app.save(record)

      return e.json(200, record)
    } catch (err) {
      $app.logger().error('Admin update user error', 'error', err.message || String(err))

      // If it's already an HTTP error (like ForbiddenError or BadRequestError), rethrow it
      if (err.status) {
        throw err
      }

      // Convert standard PocketBase Go validation errors into a 400 Bad Request
      // to prevent generic 500 Server Errors from being returned to the frontend.
      throw new BadRequestError(err.message || 'Erro ao salvar o usuário.')
    }
  },
  $apis.requireAuth(),
)

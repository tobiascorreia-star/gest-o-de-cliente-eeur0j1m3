routerAdd(
  'POST',
  '/backend/v1/audit/clear',
  (e) => {
    const auth = e.auth
    if (!auth || auth.getString('role') !== 'admin') {
      return e.forbiddenError('Apenas administradores podem limpar a auditoria.')
    }

    try {
      const col = $app.findCollectionByNameOrId('audit_logs')
      $app.truncateCollection(col)
      return e.json(200, { message: 'Auditoria limpa com sucesso' })
    } catch (err) {
      return e.internalServerError('Falha ao limpar registros de auditoria')
    }
  },
  $apis.requireAuth(),
)

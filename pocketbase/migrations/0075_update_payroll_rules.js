migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('payroll')
    col.listRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || colaborador = @request.auth.id)"
    col.viewRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || colaborador = @request.auth.id)"
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('payroll')
    col.listRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    col.viewRule = "@request.auth.id != '' && @request.auth.role = 'admin'"
    app.save(col)
  },
)

migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    if (!col.fields.getByName('role')) {
      col.fields.add(
        new SelectField({
          name: 'role',
          values: ['admin', 'operator'],
          maxSelect: 1,
        }),
      )
    }
    app.save(col)

    // Clear existing users as per 'limpe todo banco' request
    app.truncateCollection(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.fields.removeByName('role')
    app.save(col)
  },
)

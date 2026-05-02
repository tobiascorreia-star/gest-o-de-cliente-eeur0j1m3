migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    if (!col.fields.getByName('phone')) {
      col.fields.add(new TextField({ name: 'phone', required: false }))
    }
    if (!col.fields.getByName('active')) {
      col.fields.add(new BoolField({ name: 'active' }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('users')
    col.fields.removeByName('phone')
    col.fields.removeByName('active')
    app.save(col)
  },
)

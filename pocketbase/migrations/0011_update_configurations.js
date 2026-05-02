migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('configurations')
    if (!col.fields.getByName('active')) {
      col.fields.add(new BoolField({ name: 'active' }))
    }
    if (!col.fields.getByName('description')) {
      col.fields.add(new TextField({ name: 'description', required: false }))
    }
    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('configurations')
    col.fields.removeByName('active')
    col.fields.removeByName('description')
    app.save(col)
  },
)

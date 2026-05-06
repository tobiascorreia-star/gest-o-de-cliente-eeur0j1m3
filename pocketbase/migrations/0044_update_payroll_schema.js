migrate(
  (app) => {
    const col = app.findCollectionByNameOrId('payroll')

    if (!col.fields.getByName('observations')) {
      col.fields.add(
        new TextField({
          name: 'observations',
          required: false,
        }),
      )
    }

    if (!col.fields.getByName('closed')) {
      col.fields.add(
        new BoolField({
          name: 'closed',
          required: false,
        }),
      )
    }

    app.save(col)
  },
  (app) => {
    const col = app.findCollectionByNameOrId('payroll')
    col.fields.removeByName('observations')
    col.fields.removeByName('closed')
    app.save(col)
  },
)

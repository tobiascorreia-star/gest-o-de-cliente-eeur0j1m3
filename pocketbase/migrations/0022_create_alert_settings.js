migrate(
  (app) => {
    const collection = new Collection({
      name: 'alert_settings',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: null,
      fields: [
        { name: 'moderate_threshold', type: 'number', required: true },
        { name: 'critical_threshold', type: 'number', required: true },
        { name: 'old_days', type: 'number', required: true },
        { name: 'critical_days', type: 'number', required: true },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(collection)
  },
  (app) => {
    const collection = app.findCollectionByNameOrId('alert_settings')
    app.delete(collection)
  },
)

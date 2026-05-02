migrate(
  (app) => {
    // 1. Ensure users collection exists and has all fields
    let usersCol = null
    try {
      usersCol = app.findCollectionByNameOrId('users')
    } catch (_) {
      usersCol = new Collection({
        name: 'users',
        type: 'auth',
        fields: [
          { name: 'name', type: 'text' },
          {
            name: 'avatar',
            type: 'file',
            maxSelect: 1,
            maxSize: 5242880,
            mimeTypes: ['image/jpeg', 'image/png'],
          },
          { name: 'role', type: 'select', values: ['admin', 'operator'], maxSelect: 1 },
          { name: 'phone', type: 'text' },
          { name: 'active', type: 'bool' },
        ],
      })
      app.save(usersCol)
    }

    let usersUpdated = false
    if (!usersCol.fields.getByName('name')) {
      usersCol.fields.add(new TextField({ name: 'name' }))
      usersUpdated = true
    }
    if (!usersCol.fields.getByName('avatar')) {
      usersCol.fields.add(
        new FileField({
          name: 'avatar',
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png'],
        }),
      )
      usersUpdated = true
    }
    if (!usersCol.fields.getByName('role')) {
      usersCol.fields.add(
        new SelectField({ name: 'role', values: ['admin', 'operator'], maxSelect: 1 }),
      )
      usersUpdated = true
    }
    if (!usersCol.fields.getByName('phone')) {
      usersCol.fields.add(new TextField({ name: 'phone' }))
      usersUpdated = true
    }
    if (!usersCol.fields.getByName('active')) {
      usersCol.fields.add(new BoolField({ name: 'active' }))
      usersUpdated = true
    }
    if (usersUpdated) app.save(usersCol)

    // Seed default admin user
    try {
      app.findAuthRecordByEmail('users', 'tobiascorreia@gmail.com')
    } catch (_) {
      const record = new Record(usersCol)
      record.setEmail('tobiascorreia@gmail.com')
      record.setPassword('Skip@Pass')
      record.setVerified(true)
      record.set('name', 'Admin')
      record.set('role', 'admin')
      record.set('active', true)
      app.save(record)
    }

    // 2. Ensure configurations collection exists
    let confCol = null
    try {
      confCol = app.findCollectionByNameOrId('configurations')
    } catch (_) {
      confCol = new Collection({
        name: 'configurations',
        type: 'base',
        fields: [
          { name: 'type', type: 'text', required: true },
          { name: 'name', type: 'text', required: true },
          { name: 'color', type: 'text' },
          { name: 'active', type: 'bool' },
          { name: 'description', type: 'text' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
      })
      app.save(confCol)
    }

    let confUpdated = false
    if (!confCol.fields.getByName('type')) {
      confCol.fields.add(new TextField({ name: 'type', required: true }))
      confUpdated = true
    }
    if (!confCol.fields.getByName('name')) {
      confCol.fields.add(new TextField({ name: 'name', required: true }))
      confUpdated = true
    }
    if (!confCol.fields.getByName('color')) {
      confCol.fields.add(new TextField({ name: 'color' }))
      confUpdated = true
    }
    if (!confCol.fields.getByName('active')) {
      confCol.fields.add(new BoolField({ name: 'active' }))
      confUpdated = true
    }
    if (!confCol.fields.getByName('description')) {
      confCol.fields.add(new TextField({ name: 'description' }))
      confUpdated = true
    }
    if (confUpdated) app.save(confCol)

    // Seed at least 3 initial records in configurations
    const configs = [
      {
        type: 'statusList',
        name: 'Ativo',
        color: 'bg-green-100 text-green-800 border-green-200',
        active: true,
        description: 'Status padrão do cliente',
      },
      {
        type: 'categorias',
        name: 'Prioridade Alta',
        color: 'bg-red-100 text-red-800 border-red-200',
        active: true,
        description: 'Categoria de alta prioridade',
      },
      {
        type: 'pgtoTipos',
        name: 'Cartão de Crédito',
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        active: true,
        description: 'Tipo de pagamento via cartão',
      },
    ]

    configs.forEach((conf) => {
      try {
        app.findFirstRecordByData('configurations', 'name', conf.name)
      } catch (_) {
        const record = new Record(confCol)
        record.set('type', conf.type)
        record.set('name', conf.name)
        record.set('color', conf.color)
        record.set('active', conf.active)
        record.set('description', conf.description)
        app.save(record)
      }
    })
  },
  (app) => {
    // No revert needed for seed/restore migration
  },
)

migrate(
  (app) => {
    try {
      const payrollCol = app.findCollectionByNameOrId('payroll')
      app.truncateCollection(payrollCol)
    } catch (_) {}

    try {
      const settingsCol = app.findCollectionByNameOrId('payroll_settings')
      app.truncateCollection(settingsCol)
    } catch (_) {}
  },
  (app) => {
    // Can't restore truncated records in down migration
  },
)

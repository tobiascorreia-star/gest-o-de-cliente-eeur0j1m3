migrate(
  (app) => {
    const year = new Date().getFullYear()

    // Update May payrolls to open state
    app
      .db()
      .newQuery(
        `UPDATE payroll SET closed = false WHERE mes_referencia = 5 AND ano_referencia = {:year}`,
      )
      .bind({ year })
      .execute()

    // Update May financial_education to Open
    app
      .db()
      .newQuery(
        `UPDATE financial_education SET status = 'Aberto' WHERE month = 5 AND year = {:year}`,
      )
      .bind({ year })
      .execute()
  },
  (app) => {
    // Revert is ignored since state prior to reopening is ambiguous without detailed tracking
  },
)

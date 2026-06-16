routerAdd(
  'POST',
  '/backend/v1/payroll/reopen-month',
  (e) => {
    try {
      if (e.auth?.getString('role') !== 'admin') {
        return e.forbiddenError('Somente administradores podem reabrir meses.')
      }

      const body = e.requestInfo().body || {}
      const month = parseInt(body.month, 10)
      const year = parseInt(body.year, 10)

      if (!month || !year) {
        return e.badRequestError('Mês e ano são obrigatórios.')
      }

      $app.runInTransaction((txApp) => {
        // Unlock all payrolls for this month
        txApp
          .db()
          .newQuery(
            `UPDATE payroll SET closed = false WHERE mes_referencia = {:month} AND ano_referencia = {:year}`,
          )
          .bind({ month: month, year: year })
          .execute()

        // Unlock all financial education records for this month
        txApp
          .db()
          .newQuery(
            `UPDATE financial_education SET status = 'Aberto' WHERE month = {:month} AND year = {:year}`,
          )
          .bind({ month: month, year: year })
          .execute()

        // Log the audit
        const auditCol = txApp.findCollectionByNameOrId('audit_logs')
        const audit = new Record(auditCol)
        audit.set('action', 'REOPEN_MONTH')

        const months = [
          '',
          'Janeiro',
          'Fevereiro',
          'Março',
          'Abril',
          'Maio',
          'Junho',
          'Julho',
          'Agosto',
          'Setembro',
          'Outubro',
          'Novembro',
          'Dezembro',
        ]
        const monthName = months[month] || month
        audit.set('details', `Reabertura da folha e saúde financeira de ${monthName}`)
        audit.set('user', e.auth?.id)

        txApp.save(audit)
      })

      return e.json(200, { success: true })
    } catch (err) {
      return e.json(500, { error: err.message })
    }
  },
  $apis.requireAuth(),
)

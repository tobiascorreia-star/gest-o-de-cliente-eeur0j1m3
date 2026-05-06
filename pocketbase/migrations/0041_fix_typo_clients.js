migrate(
  (app) => {
    app
      .db()
      .newQuery(`
    UPDATE clients 
    SET observacoes = REPLACE(observacoes, 'por empo', 'por Tempo')
    WHERE observacoes LIKE '%por empo%'
  `)
      .execute()
  },
  (app) => {
    app
      .db()
      .newQuery(`
    UPDATE clients 
    SET observacoes = REPLACE(observacoes, 'por Tempo', 'por empo')
    WHERE observacoes LIKE '%por Tempo%'
  `)
      .execute()
  },
)

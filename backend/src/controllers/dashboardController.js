import { query } from '../db/index.js';

export async function getDashboard(req, res) {
  const [empresas, aprendizes, frequencias, desempenhos, auditoria] = await Promise.all([
    // Métricas de Empresas
    query(`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'ativa')::int AS ativas FROM empresas`),

    // Métricas de Aprendizes
    query(`SELECT 
            COUNT(*)::int AS total, 
            COUNT(*) FILTER (WHERE status = 'ativo')::int AS ativos,
            COUNT(*) FILTER (WHERE data_fim_contrato <= CURRENT_DATE + INTERVAL '30 day')::int AS vencendo 
           FROM aprendizes`),

    // Métricas de Frequência (Mês atual ou último registrado)
    query(`SELECT 
            AVG(percentual_frequencia)::float AS media_geral,
            COUNT(*) FILTER (WHERE situacao = 'critico')::int AS frequencia_critica 
           FROM frequencias 
           WHERE mes_referencia = to_char(CURRENT_DATE, 'YYYY-MM')`),

    // Métricas de Desempenho
    query(`SELECT 
            COUNT(*) FILTER (WHERE avaliacao_geral = 'excelente' OR avaliacao_geral = 'bom')::int AS alto_desempenho,
            COUNT(*) FILTER (WHERE avaliacao_geral = 'insatisfatorio')::int AS baixo_desempenho 
           FROM desempenhos`),

    // Auditoria recente
    query(`SELECT COUNT(*)::int AS total_alteracoes FROM auditoria_alteracoes WHERE data_hora > CURRENT_DATE - INTERVAL '7 day'`)
  ]);

  // Consultas adicionais para gráficos e tabelas
  const [rankingEmpresas, frequenciaPorMes, ultimasAlteracoes] = await Promise.all([
    query(`SELECT e.nome_fantasia AS name, COUNT(a.id)::int AS value 
           FROM empresas e 
           LEFT JOIN aprendizes a ON e.id = a.empresa_id 
           GROUP BY e.nome_fantasia 
           ORDER BY value DESC LIMIT 5`),

    query(`SELECT mes_referencia AS name, AVG(percentual_frequencia)::float AS media 
           FROM frequencias 
           GROUP BY mes_referencia 
           ORDER BY mes_referencia DESC LIMIT 6`),

    query(`SELECT usuario, acao, tabela, data_hora FROM auditoria_alteracoes ORDER BY data_hora DESC LIMIT 6`)
  ]);

  res.json({
    cards: {
      totalEmpresas: empresas.rows[0].total,
      empresasAtivas: empresas.rows[0].ativas,
      totalAprendizes: aprendizes.rows[0].total,
      aprendizesAtivos: aprendizes.rows[0].ativos,
      contratosVencendo: aprendizes.rows[0].vencendo,
      mediaFrequenciaMensal: frequencias.rows[0].media_geral || 0,
      frequenciasCriticas: frequencias.rows[0].frequencia_critica,
      baixoDesempenho: desempenhos.rows[0].baixo_desempenho,
      alteracoesSemana: auditoria.rows[0].total_alteracoes
    },
    charts: {
      // Distribuição de aprendizes por empresa
      aprendizesPorEmpresa: rankingEmpresas.rows,

      // Evolução da frequência média
      evolucaoFrequencia: frequenciaPorMes.rows.reverse(),

      // Status dos aprendizes (Pizza)
      statusAprendizes: [
        { name: 'Ativos', value: aprendizes.rows[0].ativos },
        { name: 'Total', value: aprendizes.rows[0].total - aprendizes.rows[0].ativos }
      ],

      // Desempenho Geral
      performanceGeral: [
        { name: 'Bom/Excelente', value: desempenhos.rows[0].alto_desempenho },
        { name: 'Insatisfatório', value: desempenhos.rows[0].baixo_desempenho }
      ]
    },
    recentActivity: ultimasAlteracoes.rows,
    proximosVencimentos: (await query(`
      SELECT nome, data_fim_contrato, email 
      FROM aprendizes 
      WHERE data_fim_contrato >= CURRENT_DATE 
      ORDER BY data_fim_contrato ASC LIMIT 5
    `)).rows
  });
}
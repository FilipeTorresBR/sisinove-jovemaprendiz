import { query } from "../db/index.js";
export async function getDashboard(req, res) {
  try {
    const [empresas, aprendizes, aprendizesPorEmpresa, ultimasFrequencias] =
      await Promise.all([
        query(
          `SELECT COUNT(*)::int AS total FROM empresas WHERE status = 'ativa'`,
        ),
        query(
          `SELECT COUNT(*)::int AS total FROM aprendizes WHERE status = 'ativo'`,
        ),
        query(`
        SELECT e.razao_social AS name, COUNT(a.id)::int AS value 
        FROM empresas e 
        LEFT JOIN aprendizes a ON e.id = a.empresa_id 
        WHERE e.status = 'ativa'
        GROUP BY e.razao_social 
        ORDER BY value DESC LIMIT 5
      `),
        query(`
        SELECT 
          a.nome as aprendiz, 
          e.razao_social as empresa, 
          f.mes_referencia as mes, 
          f.presencas, 
          f.faltas
        FROM frequencias f
        JOIN aprendizes a ON a.id = f.aprendiz_id
        JOIN empresas e ON e.id = f.empresa_id
        ORDER BY f.criado_em DESC LIMIT 6
      `),
      ]);

    res.json({
      cards: {
        empresasAtivas: empresas.rows[0].total,
        aprendizesAtivos: aprendizes.rows[0].total,
      },
      charts: {
        aprendizesPorEmpresa: aprendizesPorEmpresa.rows,
      },
      recentActivity: ultimasFrequencias.rows,
    });
  } catch (error) {
    console.error("ERRO NO DASHBOARD:", error);
    res.status(500).json({ error: error.message });
  }
}

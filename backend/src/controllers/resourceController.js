import { query } from "../db/index.js";
import { getResourceConfig, resources } from "../config/resources.js";

// Função auxiliar para preparar os dados para o PostgreSQL
function buildPayload(body, fields, file = null) {
  const payload = {};
  for (const field of fields) {
    if (field.type === "file") {
      payload[field.name] = file
        ? `/uploads/${file.filename}`
        : body[field.name] || null;
      continue;
    }

    if (Object.prototype.hasOwnProperty.call(body, field.name)) {
      let value = body[field.name];

      if (value === "" || value === "null" || value === "undefined") {
        value = null;
      }

      if (field.type === "number" && value !== null) {
        value = Number(value);
      }

      payload[field.name] = value;
    }
  }
  return payload;
}

export async function listResourcesMetadata(req, res) {
  res.json(resources);
}

export async function getResourceMeta(req, res) {
  const config = getResourceConfig(req.params.resource);
  if (!config)
    return res
      .status(404)
      .json({
        message: `Recurso '${req.params.resource}' não definido no config.`,
      });
  res.json(config);
}

export async function listResource(req, res) {
  try {
    const { resource } = req.params;
    const { role, empresa_id } = req.user; 
    const current = getResourceConfig(resource);

    if (!current) return res.status(404).json({ message: "Recurso não encontrado." });

    let sql = "";
    let params = [];
    let conditions = [];

    // 1. Define a base da Query
    if (resource === "aprendizes") {
      sql = `SELECT a.*, e.razao_social as empresa_nome FROM aprendizes a LEFT JOIN empresas e ON e.id = a.empresa_id`;
      if (role !== 'admin') {
        conditions.push(`a.empresa_id = $${params.length + 1}`);
        params.push(empresa_id);
      }
    }
    else if (resource === "frequencias") {
      sql = `SELECT f.*, a.nome as aprendiz_nome, e.razao_social as empresa_nome FROM frequencias f JOIN aprendizes a ON a.id = f.aprendiz_id JOIN empresas e ON e.id = f.empresa_id`;
      if (role !== 'admin') {
        conditions.push(`f.empresa_id = $${params.length + 1}`);
        params.push(empresa_id);
      }
    }
    else if (resource === "empresas") {
      sql = `SELECT * FROM empresas`;
      if (role !== 'admin') {
        conditions.push(`id = $${params.length + 1}`);
        params.push(empresa_id);
      }
    }
    else {
      // Para qualquer outra tabela genérica (incluindo currículos)
      sql = `SELECT * FROM ${current.table}`;
      
      // EXCEÇÃO: Se for 'curriculos', NÃO adiciona filtro de empresa_id para não-admins
      if (role !== 'admin' && resource !== 'curriculos') {
        conditions.push(`empresa_id = $${params.length + 1}`);
        params.push(empresa_id);
      }
    }

    // 2. Aplica as condições WHERE
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    sql += ` ORDER BY ${current.order}`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao listar dados." });
  }
}

export async function createResource(req, res) {
  const current = getResourceConfig(req.params.resource);
  const { role, empresa_id } = req.user;

  const payload = buildPayload(req.body, current.formFields, req.file);

  // Garante que se uma empresa criar algo, o ID dela seja injetado (exceto em curriculos)
  if (role !== 'admin' && req.params.resource !== 'curriculos' && (payload.empresa_id || req.params.resource === 'frequencias')) {
    payload.empresa_id = empresa_id;
  }

  if (req.params.resource === "frequencias") {
    const aulas = Number(payload.aulas_previstas || 0);
    const presencas = Number(payload.presencas || 0);
    payload.percentual_frequencia = aulas > 0 ? (presencas / aulas) * 100 : 0;
    payload.situacao =
      payload.percentual_frequencia < 75 ? "critico" : "regular";
  }

  const fields = Object.keys(payload);
  const placeholders = fields.map((_, index) => `$${index + 1}`).join(", ");

  const result = await query(
    `INSERT INTO ${current.table} (${fields.join(", ")}) VALUES (${placeholders}) RETURNING *`,
    fields.map((field) => payload[field]),
  );

  res.status(201).json(result.rows[0]);
}

export async function updateResource(req, res) {
  const current = getResourceConfig(req.params.resource);
  if (!current)
    return res.status(404).json({ message: "Recurso não encontrado." });

  const payload = buildPayload(req.body, current.formFields, req.file);
  const fields = Object.keys(payload);

  const sets = fields.map((field, index) => `${field} = $${index + 1}`);
  const values = fields.map((field) => payload[field]);
  values.push(req.params.id);

  const result = await query(
    `UPDATE ${current.table} SET ${sets.join(", ")} WHERE id = $${fields.length + 1} RETURNING *`,
    values,
  );

  res.json(result.rows[0]);
}

export async function deleteResource(req, res) {
  const current = getResourceConfig(req.params.resource);
  const result = await query(
    `DELETE FROM ${current.table} WHERE id = $1 RETURNING id`,
    [req.params.id],
  );
  res.json({ success: true });
}

export async function getResourceReport(req, res) {
  try {
    const { resource } = req.params;
    const { role, empresa_id } = req.user; 
    const current = getResourceConfig(resource);

    if (!current) return res.status(404).json({ message: "Recurso não encontrado." });

    let whereClause = "";
    let params = [];

    // EXCEÇÃO: Currículos mostram gráfico global para todos
    if (role !== 'admin' && resource !== 'curriculos') {
      whereClause = `WHERE empresa_id = $1`;
      params.push(empresa_id);
    }

    const summaryRows = await query(
      `SELECT ${current.chart.groupBy}::text AS label, COUNT(*)::int AS total 
       FROM ${current.table} 
       ${whereClause}
       GROUP BY ${current.chart.groupBy} 
       ORDER BY total DESC`,
      params
    );

    const totalRows = await query(
      `SELECT COUNT(*)::int AS total FROM ${current.table} ${whereClause}`,
      params
    );

    res.json({
      resource,
      label: current.label,
      total: totalRows.rows[0].total,
      chart: { ...current.chart, data: summaryRows.rows },
    });
  } catch (error) {
    console.error("Erro no report:", error);
    res.status(500).json({ message: "Erro ao gerar relatório estatístico." });
  }
}
import { query } from "../db/index.js";
import { getResourceConfig, resources } from "../config/resources.js";

// 🚀 FUNÇÃO AUXILIAR CORRIGIDA: Agora suporta múltiplos campos de arquivo usando req.files
function buildPayload(body, fields, files = null) {
  const payload = {};
  for (const field of fields) {
    if (field.type === "file") {
      // Se houver múltiplos arquivos (req.files) e o campo específico existir no upload
      if (files && files[field.name] && files[field.name][0]) {
        payload[field.name] = `/uploads/${files[field.name][0].filename}`;
      } else {
        // Se não foi enviado um arquivo novo, mantém o valor atual enviado pelo body (ou null)
        payload[field.name] = body[field.name] || null;
      }
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
    return res.status(404).json({
      message: `Recurso "${req.params.resource}" não definido no config.`,
    });
  res.json(config);
}

export async function listResource(req, res) {
  try {
    const { resource } = req.params;
    const { role, empresa_id } = req.user;
    const current = getResourceConfig(resource);

    if (!current)
      return res.status(404).json({ message: "Recurso não encontrado." });

    let sql = "";
    let params = [];
    let conditions = [];

    // 1. Define a base da Query trazendo os nomes amigáveis E os nomes originais em minúsculo
    if (resource === "aprendizes") {
      sql = `SELECT 
        a.id, 
        a.id as "ID", 
        a.nome, 
        a.nome as "Aluno", 
        a.cpf, 
        a.cpf as "CPF", 
        a.ocupacao, 
        a.ocupacao as "Ocupação", 
        a.cbo, 
        a.cbo as "CBO", 
        a.dia_aula_teorica, 
        a.dia_aula_teorica as "Dia de Aula", 
        a.horario_aula_teorica, 
        a.horario_aula_teorica as "Horário", 
        a.data_inicio_contrato, 
        TO_CHAR(a.data_inicio_contrato, 'DD/MM/YYYY') as "Inicio do Contrato", 
        a.data_fim_contrato, 
        TO_CHAR(a.data_fim_contrato, 'DD/MM/YYYY') as "Fim do Contrato", 
        a.empresa_id, 
        e.razao_social as "Empresa", 
        a.status, 
        a.status as "Situação", 
        a.attachments, 
        a.attachments as "Anexos" 
      FROM aprendizes a 
      LEFT JOIN empresas e ON e.id = a.empresa_id`;

      if (role !== "admin") {
        conditions.push(`a.empresa_id = $${params.length + 1}`);
        params.push(empresa_id);
      }
    } else if (resource === "frequencias") {
      sql = `SELECT 
        f.id, 
        f.id as "ID", 
        f.aprendiz_id, 
        a.nome as "Aluno", 
        f.empresa_id, 
        e.razao_social as "Empresa", 
        e.id as IDEmpresa, 
        f.mes_referencia, 
        f.mes_referencia as "Mês de referência", 
        f.aulas_previstas, 
        f.aulas_previstas as "Aulas Previstas", 
        f.presencas, 
        f.presencas as "Presenças", 
        f.faltas, 
        f.faltas as "Faltas", 
        f.faltas_justificadas, 
        f.faltas_justificadas as "Faltas Justificadas", 
        f.percentual_frequencia, 
        f.percentual_frequencia as "Frequência", 
        f.situacao, 
        f.situacao as "Situação", 
        f.attachments, 
        f.attachments as "Anexos" 
      FROM frequencias f 
      JOIN aprendizes a ON a.id = f.aprendiz_id 
      JOIN empresas e ON e.id = f.empresa_id`;
      
      if (role !== "admin") {
        conditions.push(`f.empresa_id = $${params.length + 1}`);
        params.push(empresa_id);
      }
    } else if (resource === "empresas") {
      sql = `SELECT 
        e.id, 
        e.id as "ID", 
        e.razao_social, 
        e.razao_social as "Razão Social", 
        e.cnpj, 
        e.cnpj as "CNPJ", 
        e.responsavel_legal, 
        e.responsavel_legal as "Responsável Legal", 
        e.email, 
        e.email as "E-Mail", 
        e.data_inicio_parceria, 
        TO_CHAR(e.data_inicio_parceria, 'DD/MM/YYYY') as "Início da parceria", 
        e.data_fim_parceria, 
        TO_CHAR(e.data_fim_parceria, 'DD/MM/YYYY') as "Fim da parceria", 
        e.status, 
        e.status as "Situação", 
        e.attachments, 
        e.attachments as "Anexos" 
      FROM empresas as e`;
      
      if (role !== "admin") {
        conditions.push(`id = $${params.length + 1}`);
        params.push(empresa_id);
      }
    } else {
      sql = `SELECT * FROM ${current.table}`;

      if (role !== "admin" && resource !== "curriculos") {
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
  try {
    const current = getResourceConfig(req.params.resource);
    const { role, empresa_id } = req.user;

    // 💡 PASSAMOS REQ.FILES EM VEZ DE REQ.FILE
    const payload = buildPayload(req.body, current.formFields, req.files);

    if (
      role !== "admin" &&
      req.params.resource !== "curriculos" &&
      (payload.empresa_id || req.params.resource === "frequencias")
    ) {
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao criar registro." });
  }
}

export async function updateResource(req, res) {
  try {
    const current = getResourceConfig(req.params.resource);
    if (!current)
      return res.status(404).json({ message: "Recurso não encontrado." });

    // 💡 PASSAMOS REQ.FILES EM VEZ DE REQ.FILE
    const payload = buildPayload(req.body, current.formFields, req.files);
    const fields = Object.keys(payload);

    const sets = fields.map((field, index) => `${field} = $${index + 1}`);
    const values = fields.map((field) => payload[field]);
    values.push(req.params.id);

    const result = await query(
      `UPDATE ${current.table} SET ${sets.join(", ")} WHERE id = $${fields.length + 1} RETURNING *`,
      values,
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erro ao atualizar registro." });
  }
}

export async function deleteResource(req, res) {
  const current = getResourceConfig(req.params.resource);
  await query(
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

    if (!current)
      return res.status(404).json({ message: "Recurso não encontrado." });

    let whereClause = "";
    let params = [];

    if (role !== "admin" && resource !== "curriculos") {
      whereClause = `WHERE empresa_id = $1`;
      params.push(empresa_id);
    }

    const summaryRows = await query(
      `SELECT ${current.chart.groupBy}::text AS label, COUNT(*)::int AS total 
       FROM ${current.table} 
       ${whereClause}
       GROUP BY ${current.chart.groupBy} 
       ORDER BY total DESC`,
      params,
    );

    const totalRows = await query(
      `SELECT COUNT(*)::int AS total FROM ${current.table} ${whereClause}`,
      params,
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

export async function getOneResource(req, res) {
  try {
    const { resource, id } = req.params;
    const { role, empresa_id } = req.user;

    const idUrl = parseInt(id);
    const idToken = parseInt(empresa_id);

    if (role === "empresas" && resource === "empresas") {
      if (idUrl !== idToken) {
        console.log(
          `Bloqueio: User idToken ${idToken} tentou acessar idUrl ${idUrl}`,
        );
        return res.status(403).json({
          message: "Você só pode visualizar os dados da sua própria empresa.",
        });
      }
    }

    const result = await query(`SELECT * FROM ${resource} WHERE id = $1`, [id]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Erro ao buscar dados." });
  }
}
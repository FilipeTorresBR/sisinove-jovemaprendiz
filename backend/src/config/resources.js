export const resources = {
  empresas: {
    label: "Gestão de Empresas",
    table: "empresas",
    order: "razao_social ASC",
    id: "id",
    searchable: [
      "razao_social",
      "nome_fantasia",
      "cnpj",
      "cidade",
      "responsavel_legal",
    ],
    formFields: [
      {
        name: "razao_social",
        label: "Razão Social",
        type: "text",
        required: true,
      },
      { name: "cnpj", label: "CNPJ", type: "text", required: true },
      { name: "email", label: "E-mail", type: "email" },
      { name: "responsavel_legal", label: "Responsável Legal", type: "text" },
      { name: "data_inicio_parceria", label: "Início Parceria", type: "date" },
      { name: "data_fim_parceria", label: "Fim Parceria", type: "date" },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: ["ativa", "inativa", "suspensa"],
        required: true,
      },
      { name: "attachments", label: "Anexo do Contrato", type: "file" },
    ],
    chart: { type: "bar", groupBy: "status", title: "Empresas por Status" },
  },

  aprendizes: {
    label: "Cadastro de Aprendizes",
    table: "aprendizes",
    order: "nome ASC",
    id: "id",
    searchable: ["nome", "cpf", "email", "ocupacao", "status"],
    formFields: [
      {
        name: "empresa_id",
        label: "Empresa",
        type: "select",
        required: true,
        resource: "empresas",
      },
      { name: "nome", label: "Nome Completo", type: "text", required: true },
      { name: "cpf", label: "CPF", type: "text", required: true },
      { name: "ocupacao", label: "Ocupação", type: "text" },
      { name: "cbo", label: "CBO", type: "text" },
      { name: "dia_aula_teorica", label: "Dia Aula Teórica", type: "text" },
      { name: "horario_aula_teorica", label: "Horário Aula", type: "text" },
      { name: "attachments", label: "Contrato PDF", type: "file" },
    ],
    chart: { type: "pie", groupBy: "status", title: "Status dos Aprendizes" },
  },

  frequencias: {
    label: "Frequência Mensal",
    table: "frequencias",
    order: "mes_referencia DESC",
    id: "id",
    formFields: [
      {
        name: "aprendiz_id",
        label: "Aprendiz",
        type: "select",
        required: true,
        resource: "aprendizes",
      },
      {
        name: "empresa_id",
        label: "Empresa",
        type: "select",
        required: true,
        resource: "empresas",
      },
      {
        name: "mes_referencia",
        label: "Mês Referência (AAAA-MM)",
        type: "text",
        required: true,
      },
      { name: "aulas_previstas", label: "Aulas Previstas", type: "number" },
      { name: "presencas", label: "Presenças", type: "number" },
      { name: "faltas", label: "Faltas", type: "number" },
      {
        name: "faltas_justificadas",
        label: "Faltas Justificadas",
        type: "number",
      },
      {
        name: "attachments",
        label: "Anexo Justificativa",
        type: "file",
      },
    ],
    chart: {
      type: "bar",
      groupBy: "situacao",
      title: "Frequência por Situação",
    },
  },

  desempenhos: {
    label: "Avaliação de Desempenho",
    table: "desempenhos",
    order: "criado_em DESC",
    id: "id",
    searchable: ["aprendiz_id"],
    formFields: [
      {
        name: "aprendiz_id",
        label: "Aprendiz",
        type: "select",
        required: true,
        resource: "aprendizes",
      },
      {
        name: "empresa_id",
        label: "Empresa",
        type: "select",
        required: true,
        resource: "empresas",
      },
      { name: "participacao", label: "Participação (0-10)", type: "number" },
      { name: "pontualidade", label: "Pontualidade (0-10)", type: "number" },
      {
        name: "comprometimento",
        label: "Comprometimento",
        type: "select",
        options: ["satisfatorio", "acompanhamento", "insatisfatorio"],
      },
      {
        name: "observacoes_instrutor",
        label: "Obs. Instrutor",
        type: "textarea",
      },
    ],
    chart: {
      type: "pie",
      groupBy: "comprometimento",
      title: "Nível de Desempenho",
    },
  },

  auditoria: {
    label: "Auditoria de Alterações",
    table: "auditoria_alteracoes",
    order: "data_hora DESC",
    id: "id",
    searchable: ["usuario", "tabela", "acao"],
    formFields: [
      { name: "usuario", label: "Usuário", type: "text" },
      { name: "tabela", label: "Tabela Alterada", type: "text" },
      { name: "registro_id", label: "ID do Registro", type: "number" },
      { name: "acao", label: "Ação (INSERT/UPDATE/DELETE)", type: "text" },
      { name: "dados_anteriores", label: "Dados Anteriores", type: "textarea" },
      { name: "dados_novos", label: "Dados Novos", type: "textarea" },
      { name: "data_hora", label: "Data/Hora", type: "text" },
    ],
    chart: { type: "bar", groupBy: "acao", title: "Ações do Sistema" },
  },
};

export function getResourceConfig(resource) {
  return resources[resource];
}

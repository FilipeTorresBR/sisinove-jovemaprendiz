PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS empresas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    cnpj TEXT UNIQUE,
    cidade TEXT,
    uf TEXT DEFAULT 'PA',
    telefone TEXT,
    email TEXT,
    responsavel_legal TEXT,
    responsavel_acompanhamento TEXT,
    data_inicio_parceria TEXT,
    data_fim_parceria TEXT,
    status TEXT DEFAULT 'ativa',
    observacoes TEXT,
    contrato_pdf TEXT,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS aprendizes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    cpf TEXT UNIQUE,
    rg TEXT,
    data_nascimento TEXT,
    telefone TEXT,
    email TEXT,
    endereco TEXT,
    responsavel_menor TEXT,
    ocupacao TEXT,
    cbo TEXT,
    programa TEXT,
    carga_horaria_pratica TEXT,
    carga_horaria_teorica TEXT,
    dia_aula_teorica TEXT,
    horario_aula_teorica TEXT,
    local_aula_teorica TEXT DEFAULT 'Laboratório de Informática SISINOVE',
    data_inicio_contrato TEXT,
    data_fim_contrato TEXT,
    status TEXT DEFAULT 'ativo',
    contrato_pdf TEXT,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE TABLE IF NOT EXISTS frequencias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aprendiz_id INTEGER NOT NULL,
    empresa_id INTEGER NOT NULL,
    mes_referencia TEXT NOT NULL,
    aulas_previstas INTEGER DEFAULT 0,
    presencas INTEGER DEFAULT 0,
    faltas INTEGER DEFAULT 0,
    faltas_justificadas INTEGER DEFAULT 0,
    atrasos INTEGER DEFAULT 0,
    percentual_frequencia REAL DEFAULT 0,
    situacao TEXT DEFAULT 'regular',
    observacoes TEXT,
    anexo_justificativa TEXT,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aprendiz_id) REFERENCES aprendizes(id),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE TABLE IF NOT EXISTS desempenhos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    aprendiz_id INTEGER NOT NULL,
    empresa_id INTEGER NOT NULL,
    mes_referencia TEXT NOT NULL,
    participacao INTEGER DEFAULT 0,
    pontualidade INTEGER DEFAULT 0,
    comprometimento INTEGER DEFAULT 0,
    comunicacao INTEGER DEFAULT 0,
    relacionamento INTEGER DEFAULT 0,
    atividades INTEGER DEFAULT 0,
    avaliacao_geral TEXT DEFAULT 'satisfatorio',
    observacoes_instrutor TEXT,
    criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (aprendiz_id) REFERENCES aprendizes(id),
    FOREIGN KEY (empresa_id) REFERENCES empresas(id)
);

CREATE TABLE IF NOT EXISTS auditoria_alteracoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT,
    tabela TEXT,
    registro_id INTEGER,
    acao TEXT,
    dados_anteriores TEXT,
    dados_novos TEXT,
    data_hora TEXT DEFAULT CURRENT_TIMESTAMP
);

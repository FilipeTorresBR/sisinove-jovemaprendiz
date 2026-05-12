-- Habilitar extensões se necessário (opcional)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS empresas (
    id SERIAL PRIMARY KEY,
    razao_social TEXT NOT NULL,
    nome_fantasia TEXT,
    cnpj TEXT UNIQUE,
    cidade TEXT,
    uf VARCHAR(2) DEFAULT 'PA',
    telefone TEXT,
    email TEXT,
    responsavel_legal TEXT,
    responsavel_acompanhamento TEXT,
    data_inicio_parceria DATE,
    data_fim_parceria DATE,
    status TEXT DEFAULT 'ativa',
    observacoes TEXT,
    contrato_pdf TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS aprendizes (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    cpf TEXT UNIQUE,
    rg TEXT,
    data_nascimento DATE,
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
    data_inicio_contrato DATE,
    data_fim_contracto DATE,
    status TEXT DEFAULT 'ativo',
    contrato_pdf TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_empresa FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS frequencias (
    id SERIAL PRIMARY KEY,
    aprendiz_id INTEGER NOT NULL,
    empresa_id INTEGER NOT NULL,
    mes_referencia VARCHAR(7) NOT NULL, -- Formato 'YYYY-MM'
    aulas_previstas INTEGER DEFAULT 0,
    presencas INTEGER DEFAULT 0,
    faltas INTEGER DEFAULT 0,
    faltas_justificadas INTEGER DEFAULT 0,
    atrasos INTEGER DEFAULT 0,
    percentual_frequencia DECIMAL(5, 2) DEFAULT 0,
    situacao TEXT DEFAULT 'regular',
    observacoes TEXT,
    anexo_justificativa TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_aprendiz FOREIGN KEY (aprendiz_id) REFERENCES aprendizes (id) ON DELETE CASCADE,
    CONSTRAINT fk_empresa_freq FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS desempenhos (
    id SERIAL PRIMARY KEY,
    aprendiz_id INTEGER NOT NULL,
    empresa_id INTEGER NOT NULL,
    mes_referencia VARCHAR(7) NOT NULL,
    participacao INTEGER DEFAULT 0,
    pontualidade INTEGER DEFAULT 0,
    comprometimento INTEGER DEFAULT 0,
    comunicacao INTEGER DEFAULT 0,
    relacionamento INTEGER DEFAULT 0,
    atividades INTEGER DEFAULT 0,
    avaliacao_geral TEXT DEFAULT 'satisfatorio',
    observacoes_instrutor TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_aprendiz_desp FOREIGN KEY (aprendiz_id) REFERENCES aprendizes (id) ON DELETE CASCADE,
    CONSTRAINT fk_empresa_desp FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(60) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT NOW()
);
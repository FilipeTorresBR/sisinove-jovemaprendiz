-- Habilitar extensões se necessário (opcional)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS empresas (
    id SERIAL PRIMARY KEY,
    razao_social TEXT NOT NULL,
    cnpj TEXT UNIQUE,
    responsavel_legal TEXT,
    email TEXT,
    data_inicio_parceria DATE,
    data_fim_parceria DATE,
    status TEXT DEFAULT 'ativa',
    attachments TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS aprendizes (
    id SERIAL PRIMARY KEY,
    empresa_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    cpf TEXT UNIQUE,
    ocupacao TEXT,
    cbo TEXT,
    dia_aula_teorica TEXT,
    horario_aula_teorica TEXT,
    data_inicio_contrato DATE,
    data_fim_contrato DATE,
    status TEXT DEFAULT 'ativo',
    attachments TEXT,
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
    anexo_justificativa TEXT,
    situacao TEXT DEFAULT 'regular',
    attachments TEXT,
    percentual_frequencia DECIMAL(5,2) DEFAULT 0,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_aprendiz FOREIGN KEY (aprendiz_id) REFERENCES aprendizes (id) ON DELETE CASCADE,
    CONSTRAINT fk_empresa_freq FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS desempenhos (
    id SERIAL PRIMARY KEY,
    aprendiz_id INTEGER NOT NULL,
    empresa_id INTEGER NOT NULL,
    participacao INTEGER DEFAULT 0,
    pontualidade INTEGER DEFAULT 0,
    comprometimento TEXT DEFAULT 'satisfatorio',
    observacoes_instrutor TEXT,
    
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_aprendiz_desp FOREIGN KEY (aprendiz_id) REFERENCES aprendizes (id) ON DELETE CASCADE,
    CONSTRAINT fk_empresa_desp FOREIGN KEY (empresa_id) REFERENCES empresas (id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS curriculos (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    nascimento DATE,
    cpf TEXT UNIQUE,
    endereco TEXT,
    cidade TEXT,
    estado TEXT,
    email TEXT,
    telefone TEXT,
    ctps_assinada TEXT,
    escolaridade TEXT,
    attachments TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(60) NOT NULL DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT NOW()
);
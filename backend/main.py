from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pathlib import Path
import json
import shutil

from database import get_conn, init_db

app = FastAPI(title='SISAPRENDIZ - API', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

UPLOAD_DIR = Path(__file__).resolve().parent / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)

class Empresa(BaseModel):
    razao_social: str
    nome_fantasia: str | None = None
    cnpj: str | None = None
    cidade: str | None = None
    uf: str | None = 'PA'
    telefone: str | None = None
    email: str | None = None
    responsavel_legal: str | None = None
    responsavel_acompanhamento: str | None = None
    data_inicio_parceria: str | None = None
    data_fim_parceria: str | None = None
    status: str | None = 'ativa'
    observacoes: str | None = None

class Aprendiz(BaseModel):
    empresa_id: int
    nome: str
    cpf: str | None = None
    rg: str | None = None
    data_nascimento: str | None = None
    telefone: str | None = None
    email: str | None = None
    endereco: str | None = None
    responsavel_menor: str | None = None
    ocupacao: str | None = None
    cbo: str | None = None
    programa: str | None = None
    carga_horaria_pratica: str | None = None
    carga_horaria_teorica: str | None = None
    dia_aula_teorica: str | None = None
    horario_aula_teorica: str | None = None
    local_aula_teorica: str | None = 'Laboratório de Informática SISINOVE'
    data_inicio_contrato: str | None = None
    data_fim_contrato: str | None = None
    status: str | None = 'ativo'

class Frequencia(BaseModel):
    aprendiz_id: int
    empresa_id: int
    mes_referencia: str
    aulas_previstas: int = 0
    presencas: int = 0
    faltas: int = 0
    faltas_justificadas: int = 0
    atrasos: int = 0
    observacoes: str | None = None

class Desempenho(BaseModel):
    aprendiz_id: int
    empresa_id: int
    mes_referencia: str
    participacao: int = 0
    pontualidade: int = 0
    comprometimento: int = 0
    comunicacao: int = 0
    relacionamento: int = 0
    atividades: int = 0
    avaliacao_geral: str = 'satisfatorio'
    observacoes_instrutor: str | None = None

@app.on_event('startup')
def startup():
    init_db()


def rows_to_dict(rows):
    return [dict(r) for r in rows]


def audit(usuario, tabela, registro_id, acao, antigos, novos):
    with get_conn() as conn:
        conn.execute(
            'INSERT INTO auditoria_alteracoes (usuario, tabela, registro_id, acao, dados_anteriores, dados_novos) VALUES (?, ?, ?, ?, ?, ?)',
            (usuario, tabela, registro_id, acao, json.dumps(antigos, ensure_ascii=False), json.dumps(novos, ensure_ascii=False))
        )

@app.get('/dashboard')
def dashboard():
    with get_conn() as conn:
        empresas = conn.execute("SELECT COUNT(*) total FROM empresas WHERE status='ativa'").fetchone()['total']
        aprendizes = conn.execute("SELECT COUNT(*) total FROM aprendizes WHERE status='ativo'").fetchone()['total']
        contratos_vence = conn.execute("SELECT COUNT(*) total FROM aprendizes WHERE status='ativo' AND data_fim_contrato <= date('now','+90 days')").fetchone()['total']
        frequencia_critica = conn.execute("SELECT COUNT(*) total FROM frequencias WHERE situacao='critico'").fetchone()['total']
        desempenho_atencao = conn.execute("SELECT COUNT(*) total FROM desempenhos WHERE avaliacao_geral IN ('em acompanhamento','insatisfatorio')").fetchone()['total']
        por_empresa = rows_to_dict(conn.execute('''
            SELECT e.razao_social empresa, COUNT(a.id) total
            FROM empresas e LEFT JOIN aprendizes a ON a.empresa_id=e.id AND a.status='ativo'
            GROUP BY e.id ORDER BY total DESC
        ''').fetchall())
    return {
        'empresas_ativas': empresas,
        'aprendizes_ativos': aprendizes,
        'contratos_a_vencer_90_dias': contratos_vence,
        'frequencia_critica': frequencia_critica,
        'desempenho_em_acompanhamento': desempenho_atencao,
        'aprendizes_por_empresa': por_empresa,
    }

@app.post('/empresas')
def criar_empresa(dados: Empresa):
    with get_conn() as conn:
        cur = conn.execute('''
            INSERT INTO empresas (razao_social, nome_fantasia, cnpj, cidade, uf, telefone, email, responsavel_legal,
            responsavel_acompanhamento, data_inicio_parceria, data_fim_parceria, status, observacoes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', tuple(dados.model_dump().values()))
        empresa_id = cur.lastrowid
    audit('admin', 'empresas', empresa_id, 'criar', {}, dados.model_dump())
    return {'id': empresa_id, **dados.model_dump()}

@app.get('/empresas')
def listar_empresas():
    with get_conn() as conn:
        return rows_to_dict(conn.execute('SELECT * FROM empresas ORDER BY razao_social').fetchall())

@app.post('/aprendizes')
def criar_aprendiz(dados: Aprendiz):
    with get_conn() as conn:
        empresa = conn.execute('SELECT id FROM empresas WHERE id=?', (dados.empresa_id,)).fetchone()
        if not empresa:
            raise HTTPException(status_code=404, detail='Empresa não encontrada')
        cur = conn.execute('''
            INSERT INTO aprendizes (empresa_id, nome, cpf, rg, data_nascimento, telefone, email, endereco, responsavel_menor,
            ocupacao, cbo, programa, carga_horaria_pratica, carga_horaria_teorica, dia_aula_teorica, horario_aula_teorica,
            local_aula_teorica, data_inicio_contrato, data_fim_contrato, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', tuple(dados.model_dump().values()))
        aprendiz_id = cur.lastrowid
    audit('admin', 'aprendizes', aprendiz_id, 'criar', {}, dados.model_dump())
    return {'id': aprendiz_id, **dados.model_dump()}

@app.get('/aprendizes')
def listar_aprendizes(empresa_id: int | None = None):
    sql = '''SELECT a.*, e.razao_social empresa FROM aprendizes a JOIN empresas e ON e.id=a.empresa_id'''
    params = []
    if empresa_id:
        sql += ' WHERE a.empresa_id=?'
        params.append(empresa_id)
    sql += ' ORDER BY a.nome'
    with get_conn() as conn:
        return rows_to_dict(conn.execute(sql, params).fetchall())

@app.post('/frequencias')
def registrar_frequencia(dados: Frequencia):
    percentual = 0
    if dados.aulas_previstas > 0:
        percentual = round((dados.presencas / dados.aulas_previstas) * 100, 2)
    situacao = 'regular'
    if percentual < 75:
        situacao = 'critico'
    elif percentual < 85:
        situacao = 'atencao'
    payload = dados.model_dump() | {'percentual_frequencia': percentual, 'situacao': situacao}
    with get_conn() as conn:
        cur = conn.execute('''
            INSERT INTO frequencias (aprendiz_id, empresa_id, mes_referencia, aulas_previstas, presencas, faltas,
            faltas_justificadas, atrasos, percentual_frequencia, situacao, observacoes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (dados.aprendiz_id, dados.empresa_id, dados.mes_referencia, dados.aulas_previstas, dados.presencas,
              dados.faltas, dados.faltas_justificadas, dados.atrasos, percentual, situacao, dados.observacoes))
        freq_id = cur.lastrowid
    audit('instrutor', 'frequencias', freq_id, 'criar', {}, payload)
    return {'id': freq_id, **payload}

@app.get('/frequencias')
def listar_frequencias(empresa_id: int | None = None, mes: str | None = None):
    sql = '''SELECT f.*, a.nome aprendiz, e.razao_social empresa FROM frequencias f
             JOIN aprendizes a ON a.id=f.aprendiz_id JOIN empresas e ON e.id=f.empresa_id WHERE 1=1'''
    params = []
    if empresa_id:
        sql += ' AND f.empresa_id=?'
        params.append(empresa_id)
    if mes:
        sql += ' AND f.mes_referencia=?'
        params.append(mes)
    with get_conn() as conn:
        return rows_to_dict(conn.execute(sql, params).fetchall())

@app.post('/desempenhos')
def registrar_desempenho(dados: Desempenho):
    with get_conn() as conn:
        cur = conn.execute('''
            INSERT INTO desempenhos (aprendiz_id, empresa_id, mes_referencia, participacao, pontualidade, comprometimento,
            comunicacao, relacionamento, atividades, avaliacao_geral, observacoes_instrutor)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', tuple(dados.model_dump().values()))
        desempenho_id = cur.lastrowid
    audit('instrutor', 'desempenhos', desempenho_id, 'criar', {}, dados.model_dump())
    return {'id': desempenho_id, **dados.model_dump()}

@app.post('/upload/{tipo}/{registro_id}')
def upload_arquivo(tipo: str, registro_id: int, arquivo: UploadFile = File(...)):
    if tipo not in ['empresa', 'aprendiz', 'frequencia']:
        raise HTTPException(status_code=400, detail='Tipo inválido')
    destino = UPLOAD_DIR / f'{tipo}_{registro_id}_{arquivo.filename}'
    with destino.open('wb') as buffer:
        shutil.copyfileobj(arquivo.file, buffer)
    return {'arquivo_salvo': str(destino.name)}

@app.get('/auditoria')
def listar_auditoria():
    with get_conn() as conn:
        return rows_to_dict(conn.execute('SELECT * FROM auditoria_alteracoes ORDER BY data_hora DESC LIMIT 200').fetchall())

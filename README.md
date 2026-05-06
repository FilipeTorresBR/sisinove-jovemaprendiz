# SISAPRENDIZ - Sistema de Gestão do Programa Jovem Aprendiz SISINOVE

Este pacote contém um protótipo inicial para levar ao TI: dashboard, frontend, API FastAPI, banco SQLite, schema e instruções de implantação.

## Estrutura

- `frontend/`: tela visual do sistema, com dashboard e módulos sugeridos.
- `backend/`: API em FastAPI + SQLite para cadastros, frequência, desempenho e auditoria.
- `backend/schema.sql`: estrutura de banco de dados sugerida.
- `docs/instrucoes_sisaprendiz.pdf`: documento para apresentar à diretoria/TI.

## Como rodar localmente no Windows

1. Instalar Python 3.11 ou superior.
2. Abrir o PowerShell dentro da pasta `backend`.
3. Criar ambiente virtual:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

4. Subir a API:

```powershell
uvicorn main:app --reload
```

5. Abrir o arquivo `frontend/index.html` no navegador.

A API ficará em `http://127.0.0.1:8000`.
A documentação técnica automática ficará em `http://127.0.0.1:8000/docs`.

## Observação

Este material é um protótipo funcional/base técnica. O TI poderá adaptar para a linguagem, banco de dados e padrão visual já utilizado nos sistemas SISINOVE.

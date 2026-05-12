# SISAPRENDIZ | Sistema de Gestão da Qualidade ISO 9001 da Sisinove

Sistema full stack pronto para hospedagem com foco em ISO 9001, auditoria, documentos, indicadores, reclamações, compras, riscos, oportunidades e mudanças, personalizado para a operação da Sisinove.

## O que está incluído

- Login com JWT
- Dashboard executiva com cards e gráficos
- CRUD dos módulos principais
- Módulo de documentos
- Controle de compras
- Indicadores de desempenho
- Gestão completa de auditorias
- Registro de conformidades e não conformidades
- Reclamações de clientes
- Gestão de processos
- Análises críticas da direção
- Plano de ação 5W2H
- Riscos
- Oportunidades
- Mudanças
- Relatórios por módulo
- Relatório consolidado de auditoria via API
- Seed inicial com dados da Sisinove
- Docker Compose para subir tudo

## Estrutura

- `frontend/` React + Vite + Recharts
- `backend/` Node.js + Express + PostgreSQL
- `docker-compose.yml` para desenvolvimento e hospedagem simplificada

## Credenciais iniciais

- **E-mail:** admin@sisinove.com.br
- **Senha:** 123456

## Como rodar com Docker

```bash
docker compose up --build
```

Acessos:

- Frontend: `http://localhost:8080`
- Backend health: `http://localhost:4000/api/health`

## Como rodar sem Docker

### Banco
Crie um PostgreSQL e use a conexão no arquivo `.env` do backend.

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run build
npm run preview -- --host 0.0.0.0
```

## Rotas principais da API

### Autenticação
- `POST /api/auth/login`

### Dashboard
- `GET /api/dashboard`

### Metadados dos módulos
- `GET /api/resources/meta/all`
- `GET /api/resources/meta/:resource`

### CRUD genérico
- `GET /api/resources/:resource`
- `POST /api/resources/:resource`
- `PUT /api/resources/:resource/:id`
- `DELETE /api/resources/:resource/:id`

### Relatórios
- `GET /api/resources/report/:resource`
- `GET /api/resources/audits/:id/report`

## Recursos disponíveis

- `documents`
- `purchases`
- `indicators`
- `audits`
- `audit_findings`
- `complaints`
- `processes`
- `management_reviews`
- `actions`
- `risks`
- `opportunities`
- `changes_log`

## Personalização Sisinove

Os dados iniciais e os módulos já foram pensados para setores como:

- Comercial
- Financeiro / Cobrança
- Pedagógico
- Secretaria
- Diretoria
- Qualidade
- Compras
- Atendimento
- Franquias

## Próxima evolução recomendada

Para produção mais avançada, o próximo ciclo pode incluir:

1. Upload de evidências e anexos
2. Geração de PDF da auditoria no front-end
3. Exportação Excel/PDF por módulo
4. Permissões mais detalhadas por perfil
5. Logs de rastreabilidade
6. Workflow de aprovação documental
7. Notificações por e-mail e WhatsApp
8. Painel por unidade e franquia
9. Integração com BI e chatbot interno

## Hospedagem recomendada

- VPS com Docker
- Railway / Render para testes
- Hostinger VPS / DigitalOcean / AWS Lightsail para produção

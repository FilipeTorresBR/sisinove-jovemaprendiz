import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import api from '../services/api';
import StatCard from '../components/StatCard';
import ChartBox from '../components/ChartBox';

const colors = ['#0b5ed7', '#7c4dff', '#27ae60', '#f39c12', '#e74c3c'];

export default function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then((response) => setData(response.data));
  }, []);

  if (!data) return <div className="loading">Carregando dashboard...</div>;

  const cards = data.cards;

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>Dashboard da Qualidade</h1>
          <p>Visão executiva do SISAPRENDIZ a operação da Sisinove.</p>
        </div>
      </header>

      <section className="stats-grid">
        <StatCard title="Processos mapeados" value={cards.processosMapeados} subtitle="processos ativos" />
        <StatCard title="Não conformidades" value={cards.naoConformidadesAbertas} subtitle="achados registrados" />
        <StatCard title="Auditorias pendentes" value={cards.auditoriasPendentes} subtitle="planejadas" />
        <StatCard title="Reclamações abertas" value={cards.reclamacoesAbertas} subtitle="em tratamento" />
        <StatCard title="Planos de ação" value={cards.planosAcaoEmAndamento} subtitle="em andamento" />
        <StatCard title="Documentos vencendo" value={cards.documentosVencendo} subtitle="próximos 30 dias" />
        <StatCard title="Compras pendentes" value={cards.comprasPendentes} subtitle="em cotação" />
        <StatCard title="Riscos altos" value={cards.riscosAltos} subtitle="prioridade máxima" />
      </section>

      <section className="charts-grid">
        <ChartBox title="Conformidades x não conformidades">
          <div className="chart-area">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.charts.findings} dataKey="value" nameKey="name" outerRadius={90}>
                  {data.charts.findings.map((entry, index) => (
                    <Cell key={entry.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartBox>

        <ChartBox title="Indicadores: meta x realizado">
          <div className="chart-area">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.charts.indicators}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="meta" fill="#7c4dff" />
                <Bar dataKey="atual" fill="#0b5ed7" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartBox>

        <ChartBox title="Reclamações por setor">
          <div className="chart-area">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.charts.complaintsBySector}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#27ae60" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartBox>

        <ChartBox title="Status das auditorias">
          <div className="chart-area">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.charts.auditStatus} dataKey="value" nameKey="name" outerRadius={90}>
                  {data.charts.auditStatus.map((entry, index) => (
                    <Cell key={entry.name} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartBox>

        <ChartBox title="Avanço dos planos de ação">
          <div className="chart-area">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={data.charts.actionsProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="progresso" stroke="#e74c3c" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartBox>
      </section>

      <section className="bottom-grid">
        <div className="panel">
          <div className="panel-header"><h3>Auditorias recentes</h3></div>
          <div className="simple-list">
            {data.recentAudits.map((item) => (
              <div key={item.id} className="simple-list-item">
                <strong>{item.code} — {item.sector}</strong>
                <span>{item.audit_type} | {item.status} | {item.planned_date?.slice(0, 10)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><h3>Planos de ação prioritários</h3></div>
          <div className="simple-list">
            {data.openActions.map((item) => (
              <div key={item.id} className="simple-list-item">
                <strong>{item.title}</strong>
                <span>{item.module_name} | {item.who_name} | {item.progress}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

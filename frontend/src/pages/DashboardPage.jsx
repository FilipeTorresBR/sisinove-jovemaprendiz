import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import api from "../services/api";
import StatCard from "../components/StatCard";
import ChartBox from "../components/ChartBox";

export default function DashboardPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/dashboard").then((res) => setData(res.data));
  }, []);

  if (!data) return <div className="loading">Carregando...</div>;

  return (
    <div>
      <header className="page-header">
        <h1>Painel Operacional</h1>
      </header>

      <section className="stats-grid">
        <StatCard title="Empresas Ativas" value={data.cards.empresasAtivas} />
        <StatCard
          title="Aprendizes Ativos"
          value={data.cards.aprendizesAtivos}
        />
      </section>

      <section className="charts-grid" style={{ gridTemplateColumns: "1fr" }}>
        <ChartBox title="Aprendizes por empresa">
          {/* Adicionamos uma classe de controle para o CSS gerenciar a altura */}
          <div className="chart-area responsive-chart-container">
            {/* O ResponsiveContainer precisa de uma altura fixa ou percentual definida no pai */}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.charts.aprendizesPorEmpresa}
                layout="vertical"
                // Reduzimos as margens para aproveitar cada pixel no celular
                margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#eee"
                />

                {/* AJUSTE ESSENCIAL: Removemos o width={620} fixo */}
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={true}
                  tickLine={true}
                  fill="#666"
                  // Essa função nativa do Recharts encurta nomes gigantes automáticos se passarem do limite
                  tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 18)}...` : value}
                  // Largura dinâmica controlada pelo CSS ou injetada de forma segura para telas pequenas
                  width={window.innerWidth < 768 ? 90 : 180}
                  tick={{ fontSize: window.innerWidth < 768 ? 10 : 12 }}
                />

                <XAxis type="number" hide />

                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  }}
                />

                <Bar
                  dataKey="value"
                  fill="#0b5ed7"
                  radius={[0, 4, 4, 0]}
                  barSize={window.innerWidth < 768 ? 10 : 14}
                >
                  <LabelList
                    dataKey="value"
                    position="right"
                    style={{ fontSize: 12, fontWeight: "bold", fill: "#333" }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartBox>
      </section>

      <section className="panel" style={{ marginTop: "20px" }}>
        <div className="panel-header">
          <h3>Últimos registros de frequência</h3>
        </div>
        <div className="table-wrapper panel">
          <table>
            <thead>
              <tr>
                <th>Aprendiz</th>
                <th>Empresa</th>
                <th>Mês</th>
                <th>Presenças</th>
                <th>Faltas</th>
              </tr>
            </thead>
            <tbody>
              {data.recentActivity.map((f, i) => (
                <tr key={i}>
                  <td>{f.aprendiz}</td>
                  <td>{f.empresa}</td>
                  <td>{f.mes}</td>
                  <td>{f.presencas}</td>
                  <td>{f.faltas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

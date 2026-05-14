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
          <div className="chart-area" style={{ padding: "10px",  }}>
            <ResponsiveContainer width="100%" >
              {/* O layout="vertical" permite barras horizontais */}
              <BarChart
                data={data.charts.aprendizesPorEmpresa}
                layout="vertical"
                margin={{ left: 30, right: 30 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={false}
                  stroke="#eee"
                />

                {/* Invertemos: o nome da empresa vai para o eixo Y */}
                <YAxis
                  dataKey="name"
                  type="category"
                  width={620}
                  tick={{ fontSize: 13, fill: "#666" }}
                  axisLine={true}
                  tickLine={true}
                />

                {/* O valor numérico vai para o eixo X */}
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
                  barSize={12} // Define a espessura da barra para ficar elegante como na imagem
                >
                  {/* Adiciona o número no final de cada barra */}
                  <LabelList
                    dataKey="value"
                    position="right"
                    style={{ fontSize: 14, fontWeight: "bold", fill: "#333" }}
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
        <table className="custom-table">
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
      </section>
    </div>
  );
}

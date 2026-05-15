import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import api from "../services/api";
import DataTable from "../components/DataTable";
import { modules } from "../config/resources";

const colors = [
  "#0b5ed7",
  "#7c4dff",
  "#27ae60",
  "#f39c12",
  "#e74c3c",
  "#16a085",
];
const user = JSON.parse(localStorage.getItem("sisq_user") || "{}");
const isAdmin = user.role?.toLowerCase() === "admin";

function emptyForm(fields) {
  return Object.fromEntries(fields.map((field) => [field.name, ""]));
}

function Field({ field, value, onChange, options }) {
  if (field.type === "textarea") {
    return (
      <textarea
        value={value ?? ""}
        onChange={(e) => onChange(field.name, e.target.value)}
        rows={4}
      />
    );
  }

  if (field.type === "select") {
    // Aqui está a mágica: ele tenta pegar do estado dinâmico 'options'
    // Se não houver nada lá, ele usa as 'options' fixas do resources.js
    const lista = options?.[field.name] || field.options || [];

    return (
      <select
        value={value ?? ""}
        onChange={(e) => onChange(field.name, e.target.value)}
      >
        <option value="">Selecione...</option>
        {lista.map((item) => (
          <option key={item.id || item} value={item.id || item}>
            {/* Tenta mostrar razao_social (empresa), nome (aprendiz) ou o próprio item */}
            {item.razao_social || item.nome || item}
          </option>
        ))}
      </select>
    );
  }
  // NOVO: Tratamento para o campo de arquivo
  if (field.type === "file") {
    return (
      <input
        type="file"
        onChange={(e) => onChange(field.name, e.target.files[0])}
      />
    );
  }

  return (
    <input
      type={
        field.type === "number"
          ? "number"
          : field.type === "date"
            ? "date"
            : "text"
      }
      value={field.type !== "file" ? (value ?? "") : undefined}
      onChange={(e) => onChange(field.name, e.target.value)}
    />
  );
}

export default function ModulePage() {
  const { resource } = useParams();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [report, setReport] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [options, setOptions] = useState({});

  async function loadAll() {
    const [metaRes, listRes, reportRes] = await Promise.all([
      api.get(`/resources/meta/${resource}`),
      api.get(`/resources/${resource}`),
      api.get(`/resources/report/${resource}`),
    ]);
    const fieldsComLink = metaRes.data.formFields.filter((f) => f.resource);

    for (const field of fieldsComLink) {
      const res = await api.get(`/resources/${field.resource}`);
      // Salva no estado usando o nome do campo como chave (ex: options.empresa_id)
      setOptions((prev) => ({ ...prev, [field.name]: res.data }));
    }
    const baseUrl = api.defaults.baseURL.replace("/api", "");

    const processedRows = listRes.data.map((row) => {
      // Criamos uma cópia da linha
      const newRow = { ...row };

      // Se houver anexo, transformamos o texto em um link simples
      if (newRow.attachments) {
        const fileUrl = `${baseUrl}${newRow.attachments}`;

        // Se a sua tabela não aceita JSX (o erro [object Object]),
        // vamos apenas formatar a string para ficar curta.
        newRow.attachments = (
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-link" // Adicione uma classe se tiver no seu CSS
            style={{ color: "#0b5ed7", fontWeight: "bold" }}
          >
            Visualizar
          </a>
        );
      }

      return newRow;
    });

    setMeta(metaRes.data);
    setRows(processedRows); // Agora passamos os dados já "mastigados"
    setReport(reportRes.data);
    setForm(emptyForm(metaRes.data.formFields));
  }

  useEffect(() => {
    loadAll();
  }, [resource]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return rows.filter((row) =>
      JSON.stringify(row).toLowerCase().includes(term),
    );
  }, [rows, search]);

  const handleChange = (name, value) =>
    setForm((current) => ({ ...current, [name]: value }));

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      // Criamos um FormData para conseguir enviar arquivos
      const formData = new FormData();

      // Adicionamos todos os campos do formulário ao FormData
      Object.keys(form).forEach((key) => {
        // Se for o campo de anexos e houver um arquivo, ele vai como binário
        if (form[key] !== null && form[key] !== undefined) {
          formData.append(key, form[key]);
        }
      });

      if (editingId) {
        await api.put(`/resources/${resource}/${editingId}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setMessage("Registro atualizado com sucesso.");
      } else {
        await api.post(`/resources/${resource}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setMessage("Registro criado com sucesso.");
      }

      setEditingId(null);
      await loadAll();
    } catch (error) {
      setMessage(error.response?.data?.message || "Falha ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(row) {
    const next = emptyForm(meta.formFields);
    for (const key of Object.keys(next)) {
      next[key] = row[key] ?? "";
    }
    setForm(next);
    setEditingId(row.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id) {
    if (!window.confirm("Deseja excluir este registro?")) return;
    await api.delete(`/resources/${resource}/${id}`);
    await loadAll();
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm(meta.formFields));
    setMessage("");
  }

  if (!meta || !report)
    return <div className="loading">Carregando módulo...</div>;

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>{modules[resource]?.label || resource}</h1>
          <p>
          </p>
        </div>
      </header>
      <section className="module-top-grid">
        {isAdmin && (
        <div className="panel">
          <div className="panel-header">
            <h3>{editingId ? "Editar registro" : "Novo registro"}</h3>
            {editingId && (
              <button className="ghost-btn" onClick={resetForm}>
                Cancelar edição
              </button>
            )}
          </div>
          <form className="form-grid" onSubmit={handleSubmit}>
            {meta.formFields.map((field) => (
              <label
                key={field.name}
                className={field.type === "textarea" ? "full-span" : ""}
              >
                <span>{field.label}</span>
                <Field
                  field={field}
                  value={form[field.name]}
                  onChange={handleChange}
                  options={options} // <--- ADICIONE ESTA LINHA EXATAMENTE ASSIM
                />
              </label>
            ))}
            {message && <div className="info-box full-span">{message}</div>}
            <div className="form-actions full-span">
              <button type="submit" disabled={saving}>
                {saving ? "Salvando..." : editingId ? "Atualizar" : "Salvar"}
              </button>
              <button type="button" className="ghost-btn" onClick={resetForm}>
                Limpar
              </button>
            </div>
          </form>
        </div>
        )}
        <div className="panel">
          <div className="panel-header">
            <h3>{report.chart.title}</h3>
          </div>
          <div className="chart-area">
            <ResponsiveContainer width="100%" height={280}>
              {report.chart.type === "pie" ? (
                <PieChart>
                  <Pie
                    data={report.chart.data}
                    dataKey="total"
                    nameKey="label"
                    outerRadius={90}
                  >
                    {report.chart.data.map((entry, index) => (
                      <Cell
                        key={entry.label}
                        fill={colors[index % colors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              ) : (
                <BarChart data={report.chart.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#0b5ed7" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          <div className="report-summary">
            <strong>{report.total}</strong>
            <span>registro(s) no módulo</span>
          </div>
        </div>
      </section>

      <div className="toolbar panel">
        <input
          className="search-input"
          placeholder="Pesquisar neste módulo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="toolbar-badge">{filtered.length} registro(s)</div>
      </div>

      <div className="panel" style={{ padding: 0, overflow: "hidden" }}>
        <div className="table-actions">
          <button className="ghost-btn" onClick={loadAll}>
            Atualizar dados
          </button>
        </div>
        <DataTable rows={filtered} />
      </div>

      <div className="inline-actions-list">
        {filtered.slice(0, 10).map((row) => (
          <div key={row.id} className="inline-action-card">
            <div>
              <strong>
                {row.title ||
                  row.name ||
                  row.code ||
                  row.protocol ||
                  `Registro #${row.id}`}
              </strong>
              <p>{Object.values(row).slice(1, 4).join(" • ")}</p>
            </div>
            <div className="mini-buttons">
              <button className="ghost-btn" onClick={() => handleEdit(row)}>
                Editar
              </button>
              <button
                className="danger-btn"
                onClick={() => handleDelete(row.id)}
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

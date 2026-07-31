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
    const lista = options?.[field.name] || field.options || [];

    return (
      <select
        value={value ?? ""}
        onChange={(e) => onChange(field.name, e.target.value)}
      >
        <option value="">Selecione...</option>
        {lista.map((item) => {
          if (item === null || item === undefined) return null;

          // Caso 1: O item é uma string simples (Ex: campo [status]: 'ativo')
          if (typeof item !== "object") {
            return (
              <option key={String(item)} value={item}>
                {item}
              </option>
            );
          }

          // Caso 2: O item é um objeto vindo do banco (Ex: campo [empresa_id])
          const idValue = item.ID ?? item.id ?? item.Id;

          // Mapeamento exato respeitando espaços, acentos e maiúsculas
          const textoExibido =
            item["Razão Social"] ||
            item.Aluno ||
            item.nome ||
            item.Empresa ||
            item.razao_social;

          return (
            <option key={String(idValue)} value={idValue}>
              {textoExibido || `ID: ${idValue}`}
            </option>
          );
        })}
      </select>
    );
  }

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
      type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
      disabled={field.disabled}
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

  // 1. Atualize a função loadAll para guardar a string pura do link
  async function loadAll() {
    const [metaRes, listRes, reportRes] = await Promise.all([
      api.get(`/resources/meta/${resource}`),
      api.get(`/resources/${resource}`),
      api.get(`/resources/report/${resource}`),
    ]);
    const fieldsComLink = metaRes.data.formFields.filter((f) => f.resource);

    for (const field of fieldsComLink) {
      const res = await api.get(`/resources/${field.resource}`);
      setOptions((prev) => ({ ...prev, [field.name]: res.data }));
    }
    const baseUrl = api.defaults.baseURL.replace("/api", "");

    const processedRows = listRes.data.map((row) => {
      const newRow = { ...row };

      // 1. Tratamento para anexos padrão (Ex: aprendizes, frequencias, empresas)
      const attachmentKey = Object.keys(newRow).find(k => k.toLowerCase() === 'attachments' || k === 'Anexos');

      if (attachmentKey && newRow[attachmentKey] && typeof newRow[attachmentKey] === "string") {
        //newRow[`_raw_${attachmentKey}`] = newRow[attachmentKey];
        const fileUrl = `${baseUrl}${newRow[attachmentKey]}`;

        newRow[attachmentKey] = (
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-link"
            style={{ color: "#0b5ed7", fontWeight: "bold" }}
          >
            Visualizar
          </a>
        );
      }

      // 2. Tratamento para o Boleto (Módulo Financeiro)
      if (newRow.boleto_attachments && typeof newRow.boleto_attachments === "string") {
        const boletoUrl = `${baseUrl}${newRow.boleto_attachments}`;

        newRow.boleto_attachments = (
          <a
            href={boletoUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-link"
            style={{ color: "#0b5ed7", fontWeight: "bold" }}
          >
            Visualizar
          </a>
        );
      }

      // 3. Tratamento para a Nota Fiscal (Módulo Financeiro)
      if (newRow.nota_fiscal_attachments && typeof newRow.nota_fiscal_attachments === "string") {
        const nfUrl = `${baseUrl}${newRow.nota_fiscal_attachments}`;

        newRow.nota_fiscal_attachments = (
          <a
            href={nfUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-link"
            style={{ color: "#0b5ed7", fontWeight: "bold" }}
          >
            Visualizar
          </a>
        );
      }

      return newRow;
    });

    setMeta(metaRes.data);
    setRows(processedRows);
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

  const handleChange = (name, value) => {
    setForm((current) => {
      const updatedForm = { ...current, [name]: value };

      // Se o campo alterado for o aprendiz_id nos módulos de frequencias ou desempenhos
      if (name === "aprendiz_id" && value) {
        const listaAprendizes = options["aprendiz_id"] || [];

        // Procura o aprendiz selecionado na lista de opções
        const aprendizSelecionado = listaAprendizes.find(
          (item) => String(item.id ?? item.ID ?? item.Id) === String(value)
        );

        if (aprendizSelecionado) {
          const empresaIdEncontrada =
            aprendizSelecionado.empresa_id ??
            aprendizSelecionado.empresa_ID ??
            aprendizSelecionado.Empresa_ID ??
            aprendizSelecionado.Empresa;

          if (empresaIdEncontrada) {
            updatedForm["empresa_id"] = String(empresaIdEncontrada);
          }
        }
      }

      return updatedForm;
    });
  };

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

  // 2. Substitua a função handleEdit por esta versão com mapeamento flexível
  function handleEdit(row) {
    const next = emptyForm(meta.formFields);
    if ((resource === "frequencias" || resource === "desempenhos") && next.aprendiz_id) {
      const listaAprendizes = options["aprendiz_id"] || [];
      const aprendiz = listaAprendizes.find(
        (item) => String(item.id ?? item.ID) === String(next.aprendiz_id)
      );
      if (aprendiz) {
        next.empresa_id = String(
          aprendiz.empresa_id ?? aprendiz.empresa_ID ?? aprendiz.Empresa ?? next.empresa_id
        );
      }
    }
    // Função interna para buscar valores na linha ignorando maiúsculas/minúsculas/acentos
    const findValueInRow = (fieldName) => {
      // Cria uma lista de possíveis nomes que essa coluna pode ter vindo do seu SQL
      const possíveisChaves = [
        fieldName,                                             // Ex: empresa_id, data_inicio_contrato
        `_raw_${fieldName}`,                                   // Versão limpa de arquivos
        fieldName.toLowerCase(),                               // tudo minúsculo
        fieldName.toUpperCase(),                               // tudo maiúsculo
      ];

      // Mapeamentos específicos baseados nas aliases que você usou nas queries do backend
      if (fieldName === 'nome') possíveisChaves.push('Aluno', 'aluno');
      if (fieldName === 'razao_social') possíveisChaves.push('razao_social', 'Razão Social');
      if (fieldName === 'cpf') possíveisChaves.push('CPF');
      if (fieldName === 'ocupacao') possíveisChaves.push('Ocupação', 'ocupacao');
      if (fieldName === 'cbo') possíveisChaves.push('CBO');
      if (fieldName === 'dia_aula_teorica') possíveisChaves.push('Dia de Aula');
      if (fieldName === 'horario_aula_teorica') possíveisChaves.push('Horário');
      if (fieldName === 'data_inicio_contrato') possíveisChaves.push('Inicio do Contrato', 'Início do contrato');
      if (fieldName === 'data_fim_contrato') possíveisChaves.push('Fim do Contrato', 'Fim do contrato');
      if (fieldName === 'status') possíveisChaves.push('Situação', 'situacao');
      if (fieldName === 'attachments') possíveisChaves.push('Anexos');
      if (fieldName === 'cnpj') possíveisChaves.push('CNPJ');
      if (fieldName === 'responsavel_legal') possíveisChaves.push('Responsável Legal');
      if (fieldName === 'email') possíveisChaves.push('E-Mail', 'email');
      if (fieldName === 'data_inicio_parceria') possíveisChaves.push('Início da parceria');
      if (fieldName === 'data_fim_parceria') possíveisChaves.push('Fim da parceria');
      if (fieldName === 'mes_referencia') possíveisChaves.push('Mês de referência');
      if (fieldName === 'aulas_previstas') possíveisChaves.push('Aulas Previstas');
      if (fieldName === 'presencas') possíveisChaves.push('Presenças');
      if (fieldName === 'faltas') possíveisChaves.push('Faltas');
      if (fieldName === 'faltas_justificadas') possíveisChaves.push('Faltas Justificadas');

      // Percorre as possibilidades e retorna a primeira que encontrar valor na row
      for (const chave of possíveisChaves) {
        if (row[chave] !== undefined && row[chave] !== null) {
          return row[chave];
        }
      }
      return "";
    };

    // Preenche o formulário comparando o field.name com os dados dinâmicos da linha
    for (const field of meta.formFields) {
      next[field.name] = findValueInRow(field.name);
    }

    setForm(next);

    // Descobre o ID correto (seja id minúsculo ou ID maiúsculo vindo do SQL)
    const recordId = row.id ?? row.ID ?? row["ID"];
    setEditingId(recordId);

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
  const canEdit = isAdmin || meta.canCompanyEdit;

  return (
    <div>
      <header className="page-header">
        <div>
          <h1>{modules[resource]?.label || resource}</h1>
          <p>
          </p>
        </div>
      </header>
      <section className="module-top-grid" >
        {canEdit && (
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
                    options={options}
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
          {resource === "frequencias" && (
            <a className="ghost-btn" href="/relatorios-frequencia">
              Gerar Relatório de Frequência
            </a>
          )}
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
                  `Registro #${row.id || row.ID}`}
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

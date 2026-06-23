import { useState, useEffect } from "react";
import api from "../services/api";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export default function FrequencyReports() {
    const user = JSON.parse(localStorage.getItem("sisq_user") || "{}");
    const isAdmin = user.role === 'admin';

    const [filters, setFilters] = useState({
        empresa_id: !isAdmin ? user.empresa_id : "",
        aprendiz_id: "",
        mes_referencia: ""
    });

    const [companies, setCompanies] = useState([]);
    const [students, setStudents] = useState([]);
    const [generating, setGenerating] = useState(false);

    // Carrega os dados para alimentar os dropdowns de filtros
    useEffect(() => {
        if (isAdmin) {
            api.get("/resources/empresas").then(res => setCompanies(res.data));
        }
        api.get("/resources/aprendizes").then(res => setStudents(res.data));
    }, [isAdmin]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleExportPDF = async () => {
        setGenerating(true);
        try {
            // 1. Buscamos as frequências brutas na API do módulo genérico
            const response = await api.get("/resources/frequencias");
            let data = response.data;

            // 2. Aplicamos os filtros no Frontend com base no que foi selecionado
            if (filters.empresa_id) {
                data = data.filter(f => f.empresa_id === parseInt(filters.empresa_id));
            }
            if (filters.aprendiz_id) {
                data = data.filter(f => f.aprendiz_id === parseInt(filters.aprendiz_id));
            }
            if (filters.mes_referencia) {
                data = data.filter(f => f.mes_referencia === filters.mes_referencia);
            }

            if (data.length === 0) {
                alert("Nenhum registro de frequência encontrado com estes filtros.");
                setGenerating(false);
                return;
            }

            // 3. INICIALIZAÇÃO DO jspdf (Layout Retrato, Unidade pt, Papel A4)
            const doc = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
            const pageWidth = doc.internal.pageSize.getWidth();
            const imgWidth = 120;
            const imgHeight = 35;
            const imgX = (pageWidth / 2) - (imgWidth / 2);
            doc.addImage(
                "/src/assets/sisinove-logo-transparente-letras-azuis.png",
                "PNG",
                imgX,
                40,
                imgWidth,
                imgHeight
            );

            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(60, 60, 60); // Tom cinza escuro corporativo
            const text1 = "SISTEMA DE ENSINO INOVE INTERATIVA";
            doc.text(text1, pageWidth / 2, 100, { align: "center" });

            // Linha 2: PROGRAMA DE APRENDIZAGEM PROFISSIONAL
            doc.setFontSize(12);
            const text2 = "PROGRAMA DE APRENDIZAGEM PROFISSIONAL";
            doc.text(text2, pageWidth / 2, 118, { align: "center" });


            doc.setFillColor(13, 110, 253); // Azul padrão do seu sistema
            doc.rect(40, 135, pageWidth - 80, 25, "F");

            // Texto dentro da faixa azul (Branco e centralizado)
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.setTextColor(255, 255, 255); // Texto Branco
            const textTitulo = "RELATÓRIO DE FREQUÊNCIA MENSAL DO APRENDIZ";
            doc.text(textTitulo, pageWidth / 2, 151, { align: "center" });

            // 5. METADADOS E HISTÓRICO (Texto cinza claro abaixo da faixa)
            doc.setFontSize(9);
            doc.setFont("helvetica", "italic");
            doc.setTextColor(100, 100, 100);
            const textoPeriodo = filters.mes_referencia ? `Período: ${filters.mes_referencia}` : "Período: Histórico Completo";
            doc.text(textoPeriodo, 40, 180);
            doc.text(`Emitido em: ${new Date().toLocaleDateString("pt-BR")}`, pageWidth - 140, 180);
            // 4. PREPARAÇÃO DA TABELA (jsPDF-AutoTable)
            const tableHeaders = [
                ["Empresa", "Aprendiz", "Mês Ref.", "Aulas Prev.", "Presenças", "Faltas", "% Freq.", "Situação"]
            ];

            const tableRows = data.map(item => {
                // 1. Convertemos os valores para números com segurança
                const previstas = Number(item.aulas_previstas || 0);
                const presencas = Number(item.presencas || 0);
                const faltas = Number(item.faltas || 0);
                const justificadas = Number(item.faltas_justificadas || 0);

                // 2. Cálculo Real da Frequência:
                // Se houver aulas previstas, a frequência é calculada baseada nas presenças e faltas justificadas
                let percentual = 100;
                if (previstas > 0) {
                    // Presenças + Justificadas sobre o total de aulas previstas
                    percentual = ((presencas + justificadas) / previstas) * 100;
                    // Garante que o percentual não ultrapasse 100% ou fique negativo
                    percentual = Math.min(Math.max(percentual, 0), 100);
                } else {
                    percentual = 0;
                }

                // 3. Regra de Negócio para a Situação (Exemplo: menor que 75% é crítico)
                let situacaoCalculada = "REGULAR";
                if (percentual < 75) {
                    situacaoCalculada = "CRÍTICO";
                } else if (percentual < 85) {
                    situacaoCalculada = "ATENÇÃO";
                }

                console.log(previstas, presencas, faltas, justificadas, situacaoCalculada, percentual)
                // 4. Retorna a linha montada com os dados computados
                return [
                    item.razao_social || `Cód. ${item.empresa_id}`,
                    item.nome || `Cód. ${item.aprendiz_id}`,
                    item.mes_referencia,
                    previstas,
                    presencas,
                    faltas,
                    `${percentual.toFixed(1)}%`, // Exibe calculado ex: "0.0%" se tiver 2 previstas e 2 faltas
                    {
                        content: situacaoCalculada,
                        styles: {
                            textColor: situacaoCalculada === "CRÍTICO" ? [200, 0, 0] : (situacaoCalculada === "ATENÇÃO" ? [215, 150, 0] : [0, 120, 0]),
                            fontStyle: "bold"
                        }
                    }
                ];
            });

            // Renderiza a tabela de forma automatizada cuidando das quebras de página
            autoTable(doc, {
                startY: 200,
                head: tableHeaders,
                body: tableRows,
                theme: "striped",
                headStyles: { fillColor: [13, 110, 253], textColor: [255, 255, 255], fontStyle: "bold" },
                styles: { fontSize: 9, cellPadding: 6 },
                columnStyles: {
                    0: { cellWidth: 100 }, // Empresa
                    1: { cellWidth: 110 }, // Aprendiz
                },
                didDrawPage: (dataPage) => {
                    doc.setFontSize(8);
                    doc.setFont("helvetica", "normal");
                    doc.text(
                        `Página ${dataPage.pageNumber}`,
                        doc.internal.pageSize.width - 60,
                        doc.internal.pageSize.height - 20
                    );
                }
            });

            // 5. SALVAMENTO / DOWNLOAD AUTOMÁTICO
            const nomeArquivo = `Frequencia_${filters.mes_referencia || "Geral"}_${Date.now()}.pdf`;
            doc.save(nomeArquivo);

        } catch (error) {
            console.error("Erro ao estruturar jspdf:", error);
            alert("Houve uma falha na montagem do documento.");
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="panel report-panel">
            <header className="page-header">
                <h1>Relatórios de Frequência </h1>
            </header>

            <div className="filter-card" style={{ background: 'white', padding: '2rem', borderRadius: '8px', marginTop: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Parâmetros do Filtro</h3>

                <div className="filter-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
                    {isAdmin ? (
                        <label style={{ display: 'flex', flexDirection: 'column', fontWeight: '500' }}>
                            Empresa
                            <select name="empresa_id" value={filters.empresa_id} onChange={handleInputChange} style={{ marginTop: '0.5rem', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                                <option value="">-- Todas as Empresas --</option>
                                {companies.map(c => <option key={c.id} value={c.id}>{c.razao_social}</option>)}
                            </select>
                        </label>
                    ) : (
                        <label style={{ display: 'flex', flexDirection: 'column', fontWeight: '500' }}>
                            Sua Empresa
                            <input type="text" value={user.name || "Empresa Vinculada"} disabled style={{ marginTop: '0.5rem', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', background: '#f5f5f5' }} />
                        </label>
                    )}

                    <label style={{ display: 'flex', flexDirection: 'column', fontWeight: '500' }}>
                        Aprendiz
                        <select name="aprendiz_id" value={filters.aprendiz_id} onChange={handleInputChange} style={{ marginTop: '0.5rem', padding: '10px', borderRadius: '6px', border: '1px solid #ccc' }}>
                            <option value="">-- Todos os Alunos --</option>
                            {students
                                .filter(s => !filters.empresa_id || s.empresa_id === parseInt(filters.empresa_id))
                                .map(s => <option key={s.id} value={s.id}>{s.nome}</option>)
                            }
                        </select>
                    </label>

                    <label style={{ display: 'flex', flexDirection: 'column', fontWeight: '500' }}>
                        Mês (YYYY-MM)
                        <input
                            type="month"
                            name="mes_referencia"
                            value={filters.mes_referencia}
                            onChange={handleInputChange}
                            style={{ marginTop: '0.5rem', padding: '9px', borderRadius: '6px', border: '1px solid #ccc' }}
                        />
                    </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                    <button
                        onClick={() => setFilters({ empresa_id: !isAdmin ? user.empresa_id : "", aprendiz_id: "", mes_referencia: "" })}
                        style={{ background: '#e2e8f0', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                    >
                        Limpar Filtros
                    </button>

                    <button
                        onClick={handleExportPDF}
                        disabled={generating}
                        style={{ background: '#0d6efd', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}
                    >
                        {generating ? "Processando..." : "Gerar Relatório"}
                    </button>
                </div>
            </div>
        </div>
    );
}
import { useState, useEffect } from "react";
import api from "../services/api";

export default function CompanyProfile() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("sisq_user") || "{}");

useEffect(() => {
  async function loadCompany() {
    console.log("Tentando carregar empresa com ID:", user.empresa_id); // Veja se aparece no F12
    if (!user.empresa_id) {
      console.error("ID da empresa não encontrado no localStorage");
      setLoading(false);
      return;
    }

    try {
      // Verifique se a URL está correta: /resources/empresas/ID
      const response = await api.get(`/resources/empresas/${user.empresa_id}`);
      console.log("Dados recebidos:", response.data);
      setCompany(response.data);
    } catch (error) {
      console.error("Erro na API:", error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  }
  loadCompany();
}, []);

  if (loading) return <div className="panel">Carregando informações...</div>;
  if (!company) return <div className="panel">Empresa não encontrada. user.empresa_id</div>;
  const baseUrl = api.defaults.baseURL.replace("/api", "");  
  const fileUrl = `${baseUrl}${company.attachments}`;
    
  return (
    <div className="profile-container">
      <header className="page-header">
        <h1>Informações do Vínculo</h1>
        <span className={`badge ${company.status}`}>{company.status}</span>
      </header>

      <div className="company-card">
        <div className="company-header">
          <div className="avatar-placeholder">
            {company.razao_social.charAt(0)}
          </div>
          <div>
            <h2>{company.razao_social}</h2>
            <p>CNPJ: {company.cnpj}</p>
          </div>
        </div>

        <div className="info-grid">
          <div className="info-item">
            <label>Responsável Legal</label>
            <p>{company.responsavel_legal || "Não informado"}</p>
          </div>
          <div className="info-item">
            <label>E-mail de Contato</label>
            <p>{company.email}</p>
          </div>
          <div className="info-item">
            <label>Início da Parceria</label>
            <p>{new Date(company.data_inicio_parceria).toLocaleDateString()}</p>
          </div>
          <div className="info-item">
            <label>Fim da Parceria</label>
            <p>{company.data_fim_parceria ? new Date(company.data_fim_parceria).toLocaleDateString() : "-"}</p>
          </div>
        </div>

        {company.attachments && (
        <div className="attachments-section" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px dashed #ddd' }}>
            <h4 style={{ marginBottom: '1rem', color: '#666' }}>Documentação Contratual</h4>
            
            <a 
            href={`${fileUrl}`} 
            target="_blank" 
            rel="noopener noreferrer"
            download
            className="download-btn"
            > Contrato de Parceria 
            
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg> 
            </a>
        </div>
        )}
      </div>

      <style jsx>{`
        .company-card { background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .company-header { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; border-bottom: 1px solid #eee; padding-bottom: 1.5rem; }
        .avatar-placeholder { width: 64px; height: 64px; background: #0b5ed7; color: white; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 2rem; font-weight: bold; }
        .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; }
        .info-item label { display: block; color: #666; font-size: 0.85rem; margin-bottom: 0.4rem; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-item p { font-weight: 600; color: #333; font-size: 1.1rem; }
        .badge { padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; text-transform: uppercase; font-weight: bold; }
        .badge.ativa { background: #e3f9e5; color: #1f7a33; }
        .file-link { display: inline-block; margin-top: 1rem; color: #0b5ed7; text-decoration: underline; font-weight: 500; }
      `}</style>
    </div>
  );
}
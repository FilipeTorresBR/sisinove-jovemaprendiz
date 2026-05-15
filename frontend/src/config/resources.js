export const modules = {
  empresas: { label: "Empresas parceiras", roles: ['admin'] },
  aprendizes: { label: "Aprendizes", roles: ['admin', 'empresas'] },
  frequencias: { label: "Frequência mensal", roles: ['admin', 'empresas'] },
  desempenhos: { label: "Desempenho teórico", roles: ['admin', 'empresas'] },
  curriculos: { label: "Banco de talentos", roles: ['admin', 'empresas'] },
};

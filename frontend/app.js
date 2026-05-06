const API_URL = 'http://127.0.0.1:8000';

const pages = document.querySelectorAll('.page');
const buttons = document.querySelectorAll('nav button');
const title = document.getElementById('page-title');

buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    pages.forEach(page => page.classList.remove('active'));
    document.getElementById(btn.dataset.page).classList.add('active');
    title.textContent = btn.textContent;
  });
});

function mockBars() {
  const data = [
    { empresa: 'Mercado Central', total: 18 },
    { empresa: 'Super Norte', total: 14 },
    { empresa: 'Comercial Pará', total: 11 },
    { empresa: 'Farmácia Vida', total: 8 },
    { empresa: 'Loja Econômica', total: 7 },
  ];
  renderBars(data);
}

function renderBars(data) {
  const max = Math.max(...data.map(item => item.total), 1);
  const container = document.getElementById('barList');
  container.innerHTML = data.map(item => `
    <div class="bar-row">
      <div><span>${item.empresa}</span><b>${item.total}</b></div>
      <div class="bar-track"><div class="bar-fill" style="width:${(item.total / max) * 100}%"></div></div>
    </div>
  `).join('');
}

async function loadDashboard() {
  try {
    const response = await fetch(`${API_URL}/dashboard`);
    if (!response.ok) throw new Error('API indisponível');
    const data = await response.json();
    document.getElementById('empresasAtivas').textContent = data.empresas_ativas;
    document.getElementById('aprendizesAtivos').textContent = data.aprendizes_ativos;
    document.getElementById('contratosVencer').textContent = data.contratos_a_vencer_90_dias;
    document.getElementById('freqCritica').textContent = data.frequencia_critica;
    renderBars(data.aprendizes_por_empresa.length ? data.aprendizes_por_empresa.map(x => ({empresa:x.empresa, total:x.total})) : []);
  } catch (error) {
    mockBars();
  }
}

loadDashboard();

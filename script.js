tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
};
// Estado da Aplicação
let state = {
  records: JSON.parse(localStorage.getItem('ponto_records') || '[]'),
  settings: JSON.parse(localStorage.getItem('ponto_settings') || '{"targetHours": 8}'),
  currentLocation: "Obtendo localização...",
  currentIp: "127.0.0.1"
};

// Inicialização ao carregar a página
window.onload = function() {
  initTheme();
  initClock();
  fetchGeolocation();
  renderApp();
  
  // Definir data padrão no modal manual
  const todayStr = new Date().toISOString().split('T')[0];
  document.getElementById('manual-date').value = todayStr;
};

// Tema Escuro / Claro
function initTheme() {
  const isDark = localStorage.getItem('ponto_theme') === 'dark' || 
      (!localStorage.getItem('ponto_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  
  if (isDark) {
      document.documentElement.classList.add('dark');
      document.getElementById('theme-icon').className = 'fa-solid fa-sun text-lg';
  } else {
      document.documentElement.classList.remove('dark');
      document.getElementById('theme-icon').className = 'fa-solid fa-moon text-lg';
  }
}

document.getElementById('theme-toggle').addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
  const isDark = document.documentElement.classList.contains('dark');
  localStorage.setItem('ponto_theme', isDark ? 'dark' : 'light');
  document.getElementById('theme-icon').className = isDark ? 'fa-solid fa-sun text-lg' : 'fa-solid fa-moon text-lg';
});

// Relógio em Tempo Real
function initClock() {
  updateClock();
  setInterval(updateClock, 1000);
}

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  document.getElementById('current-time').textContent = `${hours}:${minutes}:${seconds}`;

  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('current-date').textContent = now.toLocaleDateString('pt-BR', options);
}

// Geolocalização e IP simulado
function fetchGeolocation() {
  if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
          (position) => {
              state.currentLocation = `${position.coords.latitude.toFixed(2)}, ${position.coords.longitude.toFixed(2)}`;
              document.getElementById('location-status').innerHTML = `<i class="fa-solid fa-location-dot mr-1 text-emerald-400"></i> GPS: ${state.currentLocation}`;
          },
          (error) => {
              document.getElementById('location-status').innerHTML = `<i class="fa-solid fa-triangle-exclamation mr-1 text-amber-400"></i> Localização indisponível`;
          },
          { timeout: 10000 }
      );
  }
}

// Registrar Ponto
function registrarPonto(tipo) {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const newRecord = {
      id: Date.now().toString(),
      date: dateStr,
      time: timeStr,
      type: tipo,
      location: state.currentLocation,
      status: 'Validado'
  };

  state.records.push(newRecord);
  saveAndRender();
  showToast('Ponto Registrado!', `${tipo} registrada às ${timeStr}`);
}

// Salvar no LocalStorage e Atualizar Interface
function saveAndRender() {
  localStorage.setItem('ponto_records', JSON.stringify(state.records));
  localStorage.setItem('ponto_settings', JSON.stringify(state.settings));
  renderApp();
}

function renderApp() {
  renderTodayTable();
  renderHistoryTable();
  updateSummaryMetrics();
}

// Renderizar Tabela de Hoje
function renderTodayTable() {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = state.records.filter(r => r.date === todayStr);
  const tbody = document.getElementById('today-table-body');
  const emptyState = document.getElementById('today-empty');

  tbody.innerHTML = '';

  if (todayRecords.length === 0) {
      emptyState.classList.remove('hidden');
      return;
  } else {
      emptyState.classList.add('hidden');
  }

  // Ordenar por horário
  todayRecords.sort((a, b) => a.time.localeCompare(b.time));

  todayRecords.forEach(record => {
      let badgeColor = 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
      if (record.type === 'Entrada') badgeColor = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
      if (record.type === 'Saída') badgeColor = 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300';
      if (record.type.includes('Pausa')) badgeColor = 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors';
      tr.innerHTML = `
          <td class="py-3 px-4 font-medium"><span class="px-2.5 py-1 rounded-full text-xs font-semibold ${badgeColor}">${record.type}</span></td>
          <td class="py-3 px-4 font-mono font-semibold">${record.time.substring(0, 5)}</td>
          <td class="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs"><i class="fa-solid fa-location-dot mr-1 opacity-70"></i>${record.location}</td>
          <td class="py-3 px-4"><span class="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center"><i class="fa-solid fa-check mr-1"></i>${record.status}</span></td>
          <td class="py-3 px-4 text-right">
              <button onclick="deletarRegistro('${record.id}')" class="text-slate-400 hover:text-rose-600 transition-colors p-1" title="Excluir"><i class="fa-solid fa-trash-can"></i></button>
          </td>
      `;
      tbody.appendChild(tr);
  });
}

// Renderizar Histórico Completo Agrupado por Dia
function renderHistoryTable() {
  const tbody = document.getElementById('history-table-body');
  const emptyState = document.getElementById('history-empty');
  tbody.innerHTML = '';

  // Agrupar registros por data
  const grouped = {};
  state.records.forEach(r => {
      if (!grouped[r.date]) grouped[r.date] = [];
      grouped[r.date].push(r);
  });

  const dates = Object.keys(grouped).sort().reverse();

  if (dates.length === 0) {
      emptyState.classList.remove('hidden');
      return;
  } else {
      emptyState.classList.add('hidden');
  }

  dates.forEach(date => {
      const dayRecords = grouped[date];
      dayRecords.sort((a, b) => a.time.localeCompare(b.time));

      let entrada = '-', pausaInicio = '-', pausaFim = '-', saida = '-';
      
      dayRecords.forEach(r => {
          if (r.type === 'Entrada') entrada = r.time.substring(0, 5);
          if (r.type === 'Início Pausa') pausaInicio = r.time.substring(0, 5);
          if (r.type === 'Fim Pausa') pausaFim = r.time.substring(0, 5);
          if (r.type === 'Saída') saida = r.time.substring(0, 5);
      });

      const workedMinutes = calcularMinutosTrabalhados(dayRecords);
      const workedFormatted = formatarMinutos(workedMinutes);
      
      const targetMinutes = state.settings.targetHours * 60;
      const balanceMinutes = workedMinutes - targetMinutes;
      const balanceFormatted = formatarSaldoMinutos(balanceMinutes);
      const balanceColor = balanceMinutes >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold';

      const [year, month, day] = date.split('-');
      const formattedDate = `${day}/${month}/${year}`;

      const tr = document.createElement('tr');
      tr.className = 'hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors';
      tr.innerHTML = `
          <td class="py-3 px-4 font-medium">${formattedDate}</td>
          <td class="py-3 px-4 font-mono">${entrada}</td>
          <td class="py-3 px-4 font-mono text-slate-500">${pausaInicio}</td>
          <td class="py-3 px-4 font-mono text-slate-500">${pausaFim}</td>
          <td class="py-3 px-4 font-mono">${saida}</td>
          <td class="py-3 px-4 font-semibold">${workedFormatted}</td>
          <td class="py-3 px-4 ${balanceColor}">${balanceFormatted}</td>
      `;
      tbody.appendChild(tr);
  });
}

// Cálculo de Horas Trabalhadas
function calcularMinutosTrabalhados(records) {
  let entrada = null;
  let pausaInicio = null;
  let totalWorked = 0;
  let totalBreak = 0;

  records.forEach(r => {
      const [h, m] = r.time.split(':').map(Number);
      const mins = h * 60 + m;

      if (r.type === 'Entrada') {
          entrada = mins;
      } else if (r.type === 'Início Pausa') {
          if (entrada !== null) {
              totalWorked += (mins - entrada);
              entrada = null;
          }
          pausaInicio = mins;
      } else if (r.type === 'Fim Pausa') {
          if (pausaInicio !== null) {
              totalBreak += (mins - pausaInicio);
              pausaInicio = null;
          }
          entrada = mins;
      } else if (r.type === 'Saída') {
          if (entrada !== null) {
              totalWorked += (mins - entrada);
              entrada = null;
          }
      }
  });

  return totalWorked;
}

function calcularMinutosPausa(records) {
  let pausaInicio = null;
  let totalBreak = 0;

  records.forEach(r => {
      const [h, m] = r.time.split(':').map(Number);
      const mins = h * 60 + m;

      if (r.type === 'Início Pausa') {
          pausaInicio = mins;
      } else if (r.type === 'Fim Pausa' && pausaInicio !== null) {
          totalBreak += (mins - pausaInicio);
          pausaInicio = null;
      }
  });

  return totalBreak;
}

function formatarMinutos(totalMins) {
  if (isNaN(totalMins) || totalMins < 0) return '00:00';
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatarSaldoMinutos(totalMins) {
  if (isNaN(totalMins)) return '00:00';
  const sign = totalMins < 0 ? '-' : '+';
  const absMins = Math.abs(totalMins);
  const h = Math.floor(absMins / 60);
  const m = absMins % 60;
  return `${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Atualizar Métricas do Dashboard de Hoje
function updateSummaryMetrics() {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = state.records.filter(r => r.date === todayStr);

  const targetHours = state.settings.targetHours;
  document.getElementById('summary-target').textContent = `${String(targetHours).padStart(2, '0')}:00`;

  const workedMins = calcularMinutosTrabalhados(todayRecords);
  const breakMins = calcularMinutosPausa(todayRecords);

  document.getElementById('summary-worked').textContent = formatarMinutos(workedMins);
  document.getElementById('summary-breaks').textContent = formatarMinutos(breakMins);

  const targetMins = targetHours * 60;
  const balanceMins = workedMins - targetMins;
  const balanceFormatted = formatarSaldoMinutos(balanceMins);

  const balanceEl = document.getElementById('summary-balance');
  const balanceStatusEl = document.getElementById('summary-balance-status');
  const balanceIcon = document.getElementById('balance-icon');

  balanceEl.textContent = balanceFormatted;

  if (balanceMins > 0) {
      balanceEl.className = 'text-2xl font-bold text-emerald-600 dark:text-emerald-400';
      balanceStatusEl.textContent = 'Hora extra';
      balanceIcon.className = 'fa-solid fa-arrow-trend-up text-emerald-500';
  } else if (balanceMins < 0) {
      balanceEl.className = 'text-2xl font-bold text-rose-600 dark:text-rose-400';
      balanceStatusEl.textContent = 'Débito de horas';
      balanceIcon.className = 'fa-solid fa-arrow-trend-down text-rose-500';
  } else {
      balanceEl.className = 'text-2xl font-bold text-slate-700 dark:text-slate-200';
      balanceStatusEl.textContent = 'Na meta exata';
      balanceIcon.className = 'fa-solid fa-check text-blue-500';
  }
}

// Gerenciamento de Abas
function switchTab(tabName) {
  const tabToday = document.getElementById('tab-today');
  const tabHistory = document.getElementById('tab-history');
  const contentToday = document.getElementById('content-today');
  const contentHistory = document.getElementById('content-history');

  if (tabName === 'today') {
      tabToday.className = 'pb-3 font-semibold text-sm border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 transition-all';
      tabHistory.className = 'pb-3 font-semibold text-sm border-b-2 border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all';
      contentToday.classList.remove('hidden');
      contentHistory.classList.add('hidden');
  } else {
      tabHistory.className = 'pb-3 font-semibold text-sm border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 transition-all';
      tabToday.className = 'pb-3 font-semibold text-sm border-b-2 border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all';
      contentHistory.classList.remove('hidden');
      contentToday.classList.add('hidden');
  }
}

// Ações de Registros (Excluir e Limpar)
function deletarRegistro(id) {
  state.records = state.records.filter(r => r.id !== id);
  saveAndRender();
  showToast('Registro Excluído', 'O ponto foi removido com sucesso.', 'text-rose-500');
}

function limparRegistrosHoje() {
  const todayStr = new Date().toISOString().split('T')[0];
  state.records = state.records.filter(r => r.date !== todayStr);
  saveAndRender();
  showToast('Registros Limpos', 'Os pontos de hoje foram limpos.', 'text-amber-500');
}

function limparTodoHistorico() {
  if (confirm('Tem certeza que deseja apagar todo o histórico de pontos salvos?')) {
      state.records = [];
      saveAndRender();
      showToast('Histórico Apagado', 'Todos os dados foram resetados.', 'text-rose-500');
  }
}

// Modais (Adicionar Manual e Configurações)
function openManualModal() {
  document.getElementById('manual-modal').classList.remove('hidden');
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  document.getElementById('manual-time').value = timeStr;
}

function closeManualModal() {
  document.getElementById('manual-modal').classList.add('hidden');
}

function handleManualSubmit(e) {
  e.preventDefault();
  const type = document.getElementById('manual-type').value;
  const date = document.getElementById('manual-date').value;
  const time = document.getElementById('manual-time').value + ':00';

  const newRecord = {
      id: Date.now().toString(),
      date: date,
      time: time,
      type: type,
      location: 'Manual / Inserção Direta',
      status: 'Manual'
  };

  state.records.push(newRecord);
  saveAndRender();
  closeManualModal();
  showToast('Ponto Manual Adicionado', `${type} adicionada para ${date}`);
}

function openSettingsModal() {
  document.getElementById('setting-target-hours').value = state.settings.targetHours;
  document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettingsModal() {
  document.getElementById('settings-modal').classList.add('hidden');
}

function handleSettingsSubmit(e) {
  e.preventDefault();
  const targetHours = parseFloat(document.getElementById('setting-target-hours').value);
  state.settings.targetHours = targetHours;
  saveAndRender();
  closeSettingsModal();
  showToast('Configurações Salvas', `Jornada diária ajustada para ${targetHours}h`);
}

// Exportação CSV e JSON
function exportarCSV() {
  if (state.records.length === 0) {
      showToast('Aviso', 'Não há dados para exportar.', 'text-amber-500');
      return;
  }

  let csvContent = "data:text/csv;charset=utf-8,ID,Data,Horario,Tipo,Localizacao,Status\n";
  state.records.forEach(r => {
      csvContent += `${r.id},${r.date},${r.time},${r.type},"${r.location}",${r.status}\n`;
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `relatorio_ponto_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Exportado', 'Arquivo CSV gerado com sucesso.');
}

function exportarJSON() {
  if (state.records.length === 0) {
      showToast('Aviso', 'Não há dados para exportar.', 'text-amber-500');
      return;
  }

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `backup_ponto_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('Exportado', 'Arquivo JSON de backup gerado.');
}

// Sistema de Feedback Toast Moderno
function showToast(title, desc, iconColor = 'text-emerald-400') {
  const toast = document.getElementById('toast');
  document.getElementById('toast-title').textContent = title;
  document.getElementById('toast-desc').textContent = desc;
  
  toast.classList.remove('translate-y-32', 'opacity-0');
  
  setTimeout(() => {
      toast.classList.add('translate-y-32', 'opacity-0');
  }, 3500);
}
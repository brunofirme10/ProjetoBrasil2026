/* Brasil Copa 2026 — renderização do produto de dados sem dependências externas. */

const estado = { dadosOriginais: null, metadados: null, visualizacao: "total", categoria: "todas" };

// Somente métricas acumulativas entram no cálculo por jogo. Percentuais, médias e taxas permanecem intactos.
const METRICAS_ACUMULATIVAS = new Set([
  "vitorias", "empates", "derrotas", "gols_marcados", "gols_sofridos", "saldo_gols", "clean_sheets",
  "assistencias", "finalizacoes", "finalizacoes_no_alvo", "finalizacoes_fora_alvo", "finalizacoes_dentro_area",
  "finalizacoes_fora_area", "finalizacoes_cabeca", "escanteios", "passes", "passes_completos", "cruzamentos",
  "dribles_completos", "tentativas_quebra_linha_defensiva", "inversoes_jogo_tentadas", "turnovers_forcados",
  "pressoes_defensivas_aplicadas", "pressoes_defensivas_diretas", "faltas_cometidas", "faltas_sofridas",
  "cartoes_amarelos", "cartoes_vermelhos", "expulsoes_segundo_amarelo", "impedimentos", "defesas_goleiro",
  "acoes_defensivas_dentro_area", "acoes_defensivas_fora_area", "ofertas_receber_total", "ofertas_receber_profundidade",
  "ofertas_receber_entrelinhas", "ofertas_receber_frente", "ofertas_receber_dentro", "ofertas_receber_fora",
  "recepcoes_profundidade", "recepcoes_entre_meio_defesa", "recepcoes_sob_pressao", "corridas_alta_velocidade",
  "sprints", "distancia_total_metros", "distancia_total_km"
]);

const numero = (valor) => Number(valor);
const disponivel = (valor) => valor !== null && valor !== undefined && valor !== "" && Number.isFinite(numero(valor));
const formatarNumero = (valor, casas = 0) => disponivel(valor) ? numero(valor).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas }) : "Dado indisponível";
const formatarDecimal = (valor, casas = 2) => formatarNumero(valor, casas);
const formatarPercentual = (valor, casas = 2) => disponivel(valor) ? `${formatarNumero(valor, casas)}%` : "Dado indisponível";
const formatarDistancia = (valor) => disponivel(valor) ? `${formatarNumero(valor, 2)} km` : "Dado indisponível";
const formatarData = (valor) => valor ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(valor)) : "Dado indisponível";
const limitar = (valor, min = 0, max = 100) => Math.min(max, Math.max(min, numero(valor) || 0));
const valorCampo = (dados, campo) => {
  const valor = dados[campo];
  return estado.visualizacao === "per-game" && METRICAS_ACUMULATIVAS.has(campo) && dados.jogos
    ? numero(valor) / numero(dados.jogos)
    : valor;
};
const casasDaMetrica = (campo) => estado.visualizacao === "per-game" && METRICAS_ACUMULATIVAS.has(campo) ? 2 : 0;
const notaEscopo = () => estado.visualizacao === "per-game" ? "por jogo" : "na campanha";
const tooltip = (texto) => `<button class="info" data-tooltip="${texto}" aria-label="Mais informações">i</button>`;

async function carregarDadosBrasil() {
  const resposta = await fetch("./dados/brasil_2026.json", { cache: "no-store" });
  if (!resposta.ok) throw new Error(`Erro ao carregar dados: HTTP ${resposta.status}`);
  const resultado = await resposta.json();
  if (!resultado?.dados || typeof resultado.dados !== "object") throw new Error("O JSON não possui o objeto 'dados'.");
  return resultado;
}

function metricaCard(rotulo, valor, detalhe = "") {
  return `<article class="metric-card reveal"><span>${rotulo}</span><strong>${valor}</strong>${detalhe ? `<small>${detalhe}</small>` : ""}</article>`;
}

function renderizarVisaoGeral(d) {
  const kpis = [
    { label: "Aproveitamento", value: formatarPercentual(d.aproveitamento_pct), note: `${formatarNumero(d.vitorias)} vitórias em ${formatarNumero(d.jogos)} jogos`, cls: "kpi--primary", ring: true },
    { label: "Jogos", value: formatarNumero(d.jogos), note: "campanha analisada", cls: "kpi--lime" },
    { label: "Vitórias", value: formatarNumero(d.vitorias), note: `${formatarPercentual(numero(d.vitorias) / numero(d.jogos) * 100, 0)} das partidas`, cls: "" },
    { label: "Gols marcados", value: formatarNumero(d.gols_marcados), note: `${formatarDecimal(d.gols_por_jogo, 2)} por jogo`, cls: "kpi--yellow" },
    { label: "Gols sofridos", value: formatarNumero(d.gols_sofridos), note: `${formatarDecimal(d.gols_sofridos_por_jogo, 2)} por jogo`, cls: "" },
    { label: "Saldo", value: `${numero(d.saldo_gols) > 0 ? "+" : ""}${formatarNumero(d.saldo_gols)}`, note: "gols marcados − sofridos", cls: "" },
    { label: "xG", value: formatarDecimal(d.xg), note: "gols esperados", cls: "" }
  ];
  document.querySelector("#hero-kpis").innerHTML = kpis.map(k => `<article class="kpi ${k.cls} reveal"><span class="kpi__label">${k.label}</span><strong class="kpi__value">${k.value}</strong><span class="kpi__note">${k.note}</span>${k.ring ? '<i class="kpi__ring" aria-hidden="true"></i>' : ""}</article>`).join("");

  const jogos = numero(d.jogos) || 1;
  const resultados = [["wins", "Vitórias", d.vitorias], ["draws", "Empates", d.empates], ["losses", "Derrotas", d.derrotas]];
  document.querySelector("#campanha-registro").textContent = `${d.vitorias}V • ${d.empates}E • ${d.derrotas}D`;
  document.querySelector("#campaign-summary").innerHTML = `<div class="campaign-numbers">${resultados.map(([, r, v]) => `<div class="campaign-number"><strong>${formatarNumero(v)}</strong><span>${r}</span></div>`).join("")}</div><div class="result-bar" aria-label="Distribuição dos resultados">${resultados.map(([c,,v]) => `<span class="${c}" data-width="${limitar(numero(v) / jogos * 100)}%"></span>`).join("")}</div><div class="result-legend">${resultados.map(([c,r,v]) => `<div><strong><i class="${c}"></i>${formatarPercentual(numero(v) / jogos * 100, 0)}</strong>${r}</div>`).join("")}</div>`;
  renderizarInsights(d);
}

function renderizarInsights(d) {
  const insights = [];
  if (numero(d.precisao_passes_pct) >= 90) insights.push("Alta precisão sustenta uma circulação de bola segura.");
  else if (numero(d.precisao_passes_pct) >= 80) insights.push("A circulação mantém bom nível de precisão.");
  else insights.push("A precisão de passe aponta espaço para maior controle da posse.");
  const saldoXg = numero(d.saldo_gols_xg);
  if (Math.abs(saldoXg) <= 1) insights.push("A conversão está próxima do volume esperado pelo xG.");
  else if (saldoXg > 1) insights.push("A equipe converte acima do volume esperado pelo xG.");
  else insights.push("A produção ofensiva está abaixo do volume esperado pelo xG.");
  if (numero(d.clean_sheets) / numero(d.jogos) >= .4) insights.push("A equipe terminou sem sofrer gols em pelo menos 40% das partidas.");
  if (numero(d.gols_sofridos_por_jogo) < 1) insights.push("A defesa sofre menos de um gol por partida.");
  if (numero(d.taxa_conversao_pct) >= 12) insights.push("O volume ofensivo se traduz em uma taxa de conversão competitiva.");
  document.querySelector("#insights-list").innerHTML = insights.slice(0, 5).map(i => `<li>${i}</li>`).join("");
}

function renderizarAtaque(d) {
  const destaques = [["Gols", "gols_marcados"], ["Finalizações", "finalizacoes"], ["No alvo", "finalizacoes_no_alvo"], ["Conversão", "taxa_conversao_pct"]];
  document.querySelector("#attack-highlights").innerHTML = destaques.map(([r,c]) => `<article class="feature-metric reveal"><span>${r}</span><strong>${c.endsWith("pct") ? formatarPercentual(d[c]) : formatarNumero(valorCampo(d,c), casasDaMetrica(c))}</strong><small>${c.endsWith("pct") ? "das tentativas" : notaEscopo()}</small></article>`).join("");
  const finalizacoes = numero(d.finalizacoes) || 1;
  const alvo = numero(d.finalizacoes_no_alvo);
  const gols = numero(d.gols_marcados);
  document.querySelector("#shot-funnel").innerHTML = `<div class="funnel"><div class="funnel__step" style="width:100%"><span>FINALIZAÇÕES</span><strong>${formatarNumero(valorCampo(d,"finalizacoes"), casasDaMetrica("finalizacoes"))}</strong></div><div class="funnel__rate">↓ ${formatarPercentual(alvo / finalizacoes * 100)} chegam ao alvo</div><div class="funnel__step" style="width:72%"><span>NO ALVO</span><strong>${formatarNumero(valorCampo(d,"finalizacoes_no_alvo"), casasDaMetrica("finalizacoes_no_alvo"))}</strong></div><div class="funnel__rate">↓ ${formatarPercentual(gols / (alvo || 1) * 100)} viram gol</div><div class="funnel__step" style="width:48%"><span>GOLS</span><strong>${formatarNumero(valorCampo(d,"gols_marcados"), casasDaMetrica("gols_marcados"))}</strong></div></div>`;
  renderizarXg(d);
  const zonas = [["Dentro da área", "finalizacoes_dentro_area", ""], ["Fora da área", "finalizacoes_fora_area", "fill--gold"], ["Cabeceios", "finalizacoes_cabeca", ""]];
  document.querySelector("#shot-zones").innerHTML = zonas.map(([r,c,cls]) => { const pct = numero(d[c]) / finalizacoes * 100; return `<div class="zone-row"><header><span>${r}</span><strong>${formatarPercentual(pct, 1)}</strong></header><div class="track"><div class="fill ${cls}" data-width="${limitar(pct)}%"></div></div><small>${formatarNumero(valorCampo(d,c), casasDaMetrica(c))} ${notaEscopo()}</small></div>`; }).join("");
  const detalhes = [["Assistências","assistencias"],["Fora do alvo","finalizacoes_fora_alvo"],["Precisão","precisao_finalizacao_pct"],["Escanteios","escanteios"],["Saldo gols − xG","saldo_gols_xg"]];
  document.querySelector("#attack-details").innerHTML = detalhes.map(([r,c]) => `<div class="small-metric"><span>${r}</span><strong>${c.includes("pct") ? formatarPercentual(d[c]) : c === "saldo_gols_xg" ? `${numero(d[c]) > 0 ? "+" : ""}${formatarDecimal(d[c])}` : formatarNumero(valorCampo(d,c), casasDaMetrica(c))}</strong></div>`).join("");
}

function renderizarXg(d) {
  const gols = numero(d.gols_marcados), xg = numero(d.xg), max = Math.max(gols, xg, 1), saldo = numero(d.saldo_gols_xg);
  const diagnostico = Math.abs(saldo) <= 1 ? "Brasil converte próximo ao esperado." : saldo > 0 ? "Brasil converte acima do esperado." : "Brasil converte abaixo do esperado.";
  document.querySelector("#xg-comparison").innerHTML = `<div class="comparison-row"><header><span>Gols</span><strong>${formatarNumero(gols)}</strong></header><div class="track"><div class="fill" data-width="${gols / max * 100}%"></div></div></div><div class="comparison-row"><header><span>xG</span><strong>${formatarDecimal(xg)}</strong></header><div class="track"><div class="fill fill--gold" data-width="${xg / max * 100}%"></div></div></div><p class="diagnostic"><b>${saldo > 0 ? "+" : ""}${formatarDecimal(saldo)}</b> • ${diagnostico}</p>`;
}

function renderizarDistribuicao(d) {
  document.querySelector("#pass-hero").innerHTML = `<span>PASSES ${notaEscopo().toUpperCase()}</span><strong>${formatarNumero(valorCampo(d,"passes"), casasDaMetrica("passes"))}</strong><p>${formatarPercentual(d.precisao_passes_pct, 0)} de precisão: a equipe sustenta a circulação com alto índice de acerto.</p>`;
  const completos = numero(d.precisao_passes_pct), incompletos = 100 - completos;
  document.querySelector("#pass-quality").innerHTML = `<div class="panel__heading"><div><span class="eyebrow">Qualidade do passe</span><h3>Completos × não completos</h3></div></div><div class="pass-stat"><header><span>Passes completos</span><strong>${formatarPercentual(completos,0)}</strong></header><div class="track"><div class="fill" data-width="${limitar(completos)}%"></div></div></div><div class="pass-stat"><header><span>Não completos</span><strong>${formatarPercentual(incompletos,0)}</strong></header><div class="track"><div class="fill fill--gold" data-width="${limitar(incompletos)}%"></div></div></div><small>${formatarNumero(valorCampo(d,"passes_completos"), casasDaMetrica("passes_completos"))} passes completos ${notaEscopo()}</small>`;
  const itens = [
    ["Cruzamentos","cruzamentos",`${formatarPercentual(d.precisao_cruzamentos_pct,0)} precisão`],
    ["Dribles completos","dribles_completos","progressão individual"],
    [`Quebras de linha ${tooltip("Tentativas de passe ou condução destinadas a superar a última linha defensiva adversária.")}`,"tentativas_quebra_linha_defensiva",`${formatarPercentual(d.taxa_quebra_linha_defensiva_pct,0)} de sucesso`],
    ["Inversões tentadas","inversoes_jogo_tentadas",`${formatarPercentual(d.taxa_inversoes_jogo_pct,0)} de sucesso`]
  ];
  document.querySelector("#distribution-details").innerHTML = itens.map(([r,c,n]) => metricaCard(r, formatarNumero(valorCampo(d,c), casasDaMetrica(c)), n)).join("");
}

function renderizarMovimentacao(d) {
  const blocos = [["Profundidade","ofertas_receber_profundidade"],["Entrelinhas","ofertas_receber_entrelinhas"],["À frente","ofertas_receber_frente"],["Dentro","ofertas_receber_dentro"],["Fora","ofertas_receber_fora"]];
  document.querySelector("#movement-map").innerHTML = blocos.map(([r,c]) => `<div class="movement-block reveal"><span>${r}</span><strong>${formatarNumero(valorCampo(d,c), casasDaMetrica(c))}</strong><small>ofertas ${notaEscopo()}</small></div>`).join("");
  const recepcoes = [["Total de ofertas","ofertas_receber_total",""],["Recepções em profundidade","recepcoes_profundidade",""],["Entre meio e defesa","recepcoes_entre_meio_defesa",""],[`Sob pressão ${tooltip("Recepções realizadas com um adversário exercendo pressão imediata sobre o portador.")}`,"recepcoes_sob_pressao",""]];
  document.querySelector("#movement-receptions").innerHTML = `<div class="panel__heading"><div><span class="eyebrow">Linhas de passe</span><h3>Receber e progredir</h3></div></div>${recepcoes.map(([r,c]) => `<div class="reception-row"><span>${r}</span><strong>${formatarNumero(valorCampo(d,c), casasDaMetrica(c))}</strong><small> ${notaEscopo()}</small></div>`).join("")}`;
}

function renderizarDefesa(d) {
  const cards = [
    [`Turnovers forçados ${tooltip("Perdas de posse provocadas pela pressão ou ação defensiva da equipe.")}`,"turnovers_forcados","posses recuperadas"],
    ["Pressões aplicadas","pressoes_defensivas_aplicadas","ações de pressão"], ["Pressões diretas","pressoes_defensivas_diretas","sobre o portador"],
    ["Clean sheets","clean_sheets",`${formatarPercentual(numero(d.clean_sheets) / numero(d.jogos) * 100,0)} dos jogos`], ["Gols sofridos","gols_sofridos",`${formatarDecimal(d.gols_sofridos_por_jogo)} por jogo`]
  ];
  document.querySelector("#defense-content").innerHTML = `<article class="recovery-hero reveal"><span>TEMPO MÉDIO DE RECUPERAÇÃO ${tooltip("Tempo médio necessário para a equipe recuperar a posse após perdê-la.")}</span><strong>${formatarDecimal(d.tempo_recuperacao_bola)}</strong><small>segundos</small></article>${cards.map(([r,c,n]) => `<article class="defense-card reveal"><span>${r}</span><strong>${formatarNumero(valorCampo(d,c), casasDaMetrica(c))}</strong><small>${n}</small></article>`).join("")}`;
}

function renderizarGoleiro(d) {
  const dentro = numero(valorCampo(d,"acoes_defensivas_dentro_area")), fora = numero(valorCampo(d,"acoes_defensivas_fora_area")), max = Math.max(dentro,fora,1);
  document.querySelector("#goalkeeper-content").innerHTML = `<article class="goalkeeper-stat reveal"><span>Defesas do goleiro</span><strong>${formatarNumero(valorCampo(d,"defesas_goleiro"), casasDaMetrica("defesas_goleiro"))}</strong><small>${notaEscopo()}</small></article><article class="goalkeeper-stat reveal"><span>Jogos sem sofrer gols</span><strong>${formatarNumero(valorCampo(d,"clean_sheets"), casasDaMetrica("clean_sheets"))}</strong><small>${notaEscopo()}</small></article><article class="action-compare reveal"><h3>Ações defensivas por zona</h3><div class="action-bars"><div data-height="${limitar(dentro/max*100)}%"><strong>${formatarNumero(dentro, casasDaMetrica("acoes_defensivas_dentro_area"))}</strong><span>Dentro da área</span></div><div data-height="${limitar(fora/max*100)}%"><strong>${formatarNumero(fora, casasDaMetrica("acoes_defensivas_fora_area"))}</strong><span>Fora da área</span></div></div></article>`;
}

function renderizarFisico(d) {
  const cards = [["Sprints","sprints","arrancadas"],["Corridas em alta velocidade","corridas_alta_velocidade","ações intensas"],["Velocidade média","velocidade_media_kmh","km/h"]];
  document.querySelector("#physical-content").innerHTML = `<article class="physical-main reveal"><span>DISTÂNCIA TOTAL ${notaEscopo().toUpperCase()}</span><strong>${formatarNumero(valorCampo(d,"distancia_total_km"),2)}</strong><small>km percorridos</small></article>${cards.map(([r,c,n]) => `<article class="physical-card reveal"><span>${r}</span><strong>${formatarNumero(valorCampo(d,c), c === "velocidade_media_kmh" ? 2 : casasDaMetrica(c))}</strong><small>${n} ${c === "velocidade_media_kmh" ? "" : notaEscopo()}</small></article>`).join("")}`;
}

function renderizarDisciplina(d) {
  const itens = [["Faltas cometidas","faltas_cometidas",""],["Faltas sofridas","faltas_sofridas",""],["Amarelos","cartoes_amarelos",'<i class="card-symbol" aria-label="cartão amarelo"></i>'],["Vermelhos","cartoes_vermelhos",'<i class="card-symbol card-symbol--red" aria-label="cartão vermelho"></i>'],["2º amarelo","expulsoes_segundo_amarelo",'<i class="card-symbol" aria-label="segundo cartão amarelo"></i>'],["Impedimentos","impedimentos",""]];
  document.querySelector("#discipline-content").innerHTML = itens.map(([r,c,s]) => `<article class="discipline-item reveal"><span>${r}</span><strong>${formatarNumero(valorCampo(d,c), casasDaMetrica(c))}${s}</strong><small>${notaEscopo()}</small></article>`).join("");
}

function renderizarDashboard(dados, metadados) {
  document.querySelector("#data-atualizacao").textContent = formatarData(metadados.data_exportacao);
  renderizarVisaoGeral(dados); renderizarAtaque(dados); renderizarDistribuicao(dados); renderizarMovimentacao(dados);
  renderizarDefesa(dados); renderizarGoleiro(dados); renderizarFisico(dados); renderizarDisciplina(dados);
  document.querySelectorAll("[data-width]").forEach(el => requestAnimationFrame(() => { el.style.width = el.dataset.width; }));
  document.querySelectorAll("[data-height]").forEach(el => requestAnimationFrame(() => { el.style.height = el.dataset.height; }));
  observarEntradas(); aplicarFiltroCategoria();
}

function aplicarFiltroCategoria() {
  document.querySelectorAll("[data-category]").forEach(secao => {
    const categorias = secao.dataset.category.split(" ");
    secao.classList.toggle("category-hidden", estado.categoria !== "todas" && !categorias.includes(estado.categoria));
  });
}

function configurarFiltros() {
  const categorias = [["todas","Todas"],["ataque","Ataque"],["distribuicao","Distribuição"],["defesa","Defesa"],["movimentacao","Movimentação"],["fisico","Físico"]];
  const container = document.querySelector("#category-options");
  container.innerHTML = categorias.map(([v,r],i) => `<button type="button" class="filter-chip ${i === 0 ? "active" : ""}" data-category-filter="${v}">${r}</button>`).join("");
  container.addEventListener("click", e => { const btn = e.target.closest("button"); if (!btn) return; estado.categoria = btn.dataset.categoryFilter; container.querySelectorAll("button").forEach(b => b.classList.toggle("active", b === btn)); aplicarFiltroCategoria(); });
  document.querySelector(".view-filter").addEventListener("click", e => { const btn = e.target.closest("[data-view]"); if (!btn || btn.dataset.view === estado.visualizacao) return; estado.visualizacao = btn.dataset.view; document.querySelectorAll("[data-view]").forEach(b => b.classList.toggle("active", b === btn)); renderizarDashboard(estado.dadosOriginais, estado.metadados); });
  document.querySelector(".filters-toggle").addEventListener("click", e => { const body = document.querySelector("#filters-body"), open = body.classList.toggle("open"); e.currentTarget.setAttribute("aria-expanded", open); e.currentTarget.querySelector("span").textContent = open ? "−" : "+"; });
}

function observarNavegacao() {
  const links = [...document.querySelectorAll(".section-nav a")];
  const navegacao = document.querySelector(".section-nav__inner");

  // O deslocamento vertical é calculado pela altura real da barra sticky.
  // Assim, o início da seção fica no topo sem ser encoberto pela navegação.
  links.forEach(link => link.addEventListener("click", evento => {
    const alvo = document.querySelector(link.hash);
    if (!alvo) return;
    evento.preventDefault();
    // A navegação principal sempre prevalece sobre um filtro de categoria ativo.
    if (alvo.classList.contains("category-hidden")) {
      estado.categoria = "todas";
      document.querySelectorAll("[data-category-filter]").forEach(botao => botao.classList.toggle("active", botao.dataset.categoryFilter === "todas"));
      aplicarFiltroCategoria();
    }
    const alturaNav = document.querySelector(".section-nav")?.offsetHeight || 0;
    const topo = alvo.getBoundingClientRect().top + window.scrollY - alturaNav;
    const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: Math.max(0, topo), behavior: reduzirMovimento ? "auto" : "smooth" });
    history.replaceState(null, "", link.hash);
  }));

  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const ativo = links.find(a => a.hash === `#${entry.target.id}`);
    links.forEach(a => a.classList.toggle("active", a === ativo));
    // Move exclusivamente o eixo horizontal da barra. Usar scrollIntoView aqui também
    // afetava o scroll vertical e causava saltos/travamentos principalmente no mobile.
    if (ativo && navegacao && window.matchMedia("(max-width: 760px)").matches) {
      const esquerda = ativo.offsetLeft - (navegacao.clientWidth - ativo.offsetWidth) / 2;
      navegacao.scrollTo({ left: Math.max(0, esquerda), behavior: "smooth" });
    }
  }), { rootMargin: "-20% 0px -65%", threshold: 0 });
  links.forEach(a => { const alvo = document.querySelector(a.hash); if (alvo) observer.observe(alvo); });
}

function configurarTooltipsResponsivos() {
  const ajustar = (botao) => {
    const largura = Math.min(240, window.innerWidth - 28);
    const caixa = botao.getBoundingClientRect();
    const centro = caixa.left + caixa.width / 2;
    const margem = 14;
    let deslocamento = 0;
    if (centro - largura / 2 < margem) deslocamento = margem - (centro - largura / 2);
    if (centro + largura / 2 > window.innerWidth - margem) deslocamento = window.innerWidth - margem - (centro + largura / 2);
    botao.style.setProperty("--tooltip-shift", `${deslocamento}px`);
  };
  document.addEventListener("pointerover", e => { const botao = e.target.closest("[data-tooltip]"); if (botao) ajustar(botao); });
  document.addEventListener("focusin", e => { const botao = e.target.closest("[data-tooltip]"); if (botao) ajustar(botao); });
}

function observarEntradas() {
  const observer = new IntersectionObserver((entries, obs) => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add("visible"); obs.unobserve(entry.target); } }), { threshold: .08 });
  document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
}

async function iniciar() {
  const carregamento = document.querySelector("#estado-carregamento"), dashboard = document.querySelector("#dashboard"), erro = document.querySelector("#estado-erro");
  carregamento.hidden = false; dashboard.hidden = true; erro.hidden = true;
  try { const resultado = await carregarDadosBrasil(); estado.dadosOriginais = resultado.dados; estado.metadados = resultado; renderizarDashboard(resultado.dados, resultado); carregamento.hidden = true; dashboard.hidden = false; observarNavegacao(); }
  catch (falha) { console.error("Falha ao inicializar dashboard:", falha); carregamento.hidden = true; erro.hidden = false; }
}

document.addEventListener("DOMContentLoaded", () => { configurarFiltros(); configurarTooltipsResponsivos(); document.querySelector("#retry-button").addEventListener("click", iniciar); iniciar(); });

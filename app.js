const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const navItems = [
  ["dashboard", "Dashboard"],
  ["caixa", "Caixa / Carrinho"],
  ["produtos", "Produtos"],
  ["clientes", "Clientes"],
  ["fornecedores", "Fornecedores"],
  ["estoque", "Baixa de estoque"],
  ["historico", "Historico de vendas"],
  ["documento", "Status fiscal"],
  ["config", "Configuracao fiscal"],
];

const categories = ["Semijoias", "Acessorios", "Presentes", "Promocoes", "Servicos", "Fiscal rapido", "Mais vendidos", "Lancamentos"];

const fiscalStates = [
  ["pendente", "Pendente", "Aguardando entrada na fila fiscal."],
  ["processando", "Processando", "XML em montagem e validacao local."],
  ["aguardando_retorno", "Aguardando retorno", "Enviado para autorizadora, sem resposta final."],
  ["contingencia", "Contingencia", "SEFAZ indisponivel, venda continua."],
  ["autorizado", "Autorizado", "Documento autorizado e protocolado."],
  ["rejeitado", "Rejeitado", "Precisa correcao antes de autorizar."],
  ["denegado", "Denegado", "Uso fiscal bloqueado pela autorizadora."],
  ["cancelado", "Cancelado", "Documento autorizado foi cancelado."],
  ["inutilizado", "Inutilizado", "Numero fiscal inutilizado."],
  ["encerrado", "Encerrado", "Documento de transporte encerrado."],
  ["erro", "Erro", "Falha tecnica no fluxo local."],
];

const state = {
  logged: false,
  view: "dashboard",
  sefazOnline: true,
  environment: "Homologacao",
  modalMode: null,
  selectedDocId: null,
  emitting: false,
  lastSale: null,
  products: [
    { id: 1, sku: "1001", name: "Argola demo banho ouro", category: "Semijoias", price: 128.9, stock: 12, color: "green" },
    { id: 2, sku: "1002", name: "Colar ponto de luz demo", category: "Semijoias", price: 89.9, stock: 8, color: "coral" },
    { id: 3, sku: "1003", name: "Anel regulavel demo", category: "Semijoias", price: 59.9, stock: 17, color: "yellow" },
    { id: 4, sku: "1004", name: "Pulseira masculina demo", category: "Acessorios", price: 149.9, stock: 5, color: "blue" },
    { id: 5, sku: "1005", name: "Kit presente demo", category: "Presentes", price: 219.9, stock: 9, color: "purple" },
    { id: 6, sku: "1006", name: "Brinco pequeno demo", category: "Promocoes", price: 39.9, stock: 24, color: "green" },
    { id: 7, sku: "1007", name: "Limpeza tecnica demo", category: "Servicos", price: 29.9, stock: 99, color: "gray" },
    { id: 8, sku: "1008", name: "Tornozeleira demo", category: "Lancamentos", price: 74.9, stock: 11, color: "coral" },
    { id: 9, sku: "1009", name: "Escapulario demo", category: "Mais vendidos", price: 118.9, stock: 7, color: "yellow" },
    { id: 10, sku: "1010", name: "Pingente letra demo", category: "Semijoias", price: 64.9, stock: 18, color: "blue" },
  ],
  customers: [
    { id: 1, name: "Cliente Aurora Ficticia", doc: "123.456.789-00", phone: "(54) 90000-0001", type: "CPF ficticio" },
    { id: 2, name: "Comercial Serra Demo Ltda", doc: "12.345.678/0001-99", phone: "(54) 90000-0002", type: "CNPJ ficticio" },
  ],
  suppliers: [
    { id: 1, name: "Fornecedor Vitta Demo", doc: "23.456.789/0001-88", contact: "compras@demo.local" },
    { id: 2, name: "Atacado Norte Ficticio", doc: "34.567.890/0001-77", contact: "fiscal@demo.local" },
  ],
  cart: [
    { productId: 1, qty: 1 },
  ],
  sales: [
    saleSeed("000.478", "autorizado", 428.7, "2026-09-07"),
    saleSeed("000.479", "rejeitado", 89.9, "2026-09-07"),
    saleSeed("000.480", "contingencia", 238.8, "2026-09-06"),
    saleSeed("000.481", "cancelado", 59.9, "2026-09-06"),
  ],
  stockLog: [
    { item: "Argola demo banho ouro", qty: -1, source: "Venda NFC-e 000.478", when: "Hoje 10:21" },
    { item: "Anel regulavel demo", qty: -2, source: "Venda NFC-e 000.480", when: "Ontem 18:02" },
  ],
};

function saleSeed(number, status, total, date) {
  return {
    id: `sale-${number}`,
    number,
    date,
    customer: "Consumidor final ficticio",
    total,
    payment: "Pix",
    doc: {
      model: "NF-e",
      series: "1",
      number,
      status,
      key: `CHAVE-FICTICIA-NFE-${number}`,
      protocol: status === "autorizado" ? `PROTOCOLO-FICTICIO-${number}` : "SEM-PROTOCOLO-FICTICIO",
    },
  };
}

function $(selector) {
  return document.querySelector(selector);
}

function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.add("show");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => el.classList.remove("show"), 2600);
}

function setView(view) {
  state.view = view;
  $("#page-title").textContent = navItems.find(([id]) => id === view)?.[1] || "Awtorizei";
  renderNav();
  render();
}

function renderNav() {
  $("#nav").innerHTML = navItems.map(([id, label]) => `
    <button class="${state.view === id ? "active" : ""}" data-view="${id}">
      <span>${iconFor(id)}</span>${label}
    </button>
  `).join("");
}

function iconFor(id) {
  return {
    dashboard: "▦",
    produtos: "□",
    clientes: "◇",
    fornecedores: "▱",
    caixa: "✓",
    estoque: "▤",
    historico: "≡",
    documento: "☑",
    config: "⚙",
  }[id] || "•";
}

function statusClass(status) {
  if (status === "autorizado") return "authorized";
  if (status === "pendente") return "pending";
  if (status === "processando") return "processing";
  if (status === "aguardando_retorno") return "waiting";
  if (status === "contingencia") return "contingency";
  if (status === "rejeitado") return "rejected";
  if (status === "denegado") return "denied";
  if (status === "cancelado") return "canceled";
  if (status === "inutilizado") return "voided";
  if (status === "encerrado") return "closed";
  return "error";
}

function statusLabel(status) {
  return fiscalStates.find(([id]) => id === status)?.[1] || status;
}

function cartRows() {
  return state.cart.map((line) => {
    const product = state.products.find((item) => item.id === line.productId);
    return { ...line, product, total: product.price * line.qty };
  });
}

function cartTotal() {
  return cartRows().reduce((sum, line) => sum + line.total, 0);
}

function render() {
  $("#sefaz-status").textContent = state.sefazOnline ? "SEFAZ online" : "SEFAZ offline";
  $("#sefaz-status").className = `status-pill ${state.sefazOnline ? "ok" : "contingency"}`;
  $("#toggle-contingency").textContent = state.sefazOnline ? "Simular SEFAZ offline" : "Voltar SEFAZ online";
  $("#contingency-banner").classList.toggle("hidden", state.sefazOnline);

  const views = {
    dashboard: dashboardView,
    produtos: productsView,
    clientes: customersView,
    fornecedores: suppliersView,
    caixa: cashierView,
    estoque: stockView,
    historico: historyView,
    documento: documentView,
    config: configView,
  };
  $("#view").innerHTML = views[state.view]();
  bindViewEvents();
}

function dashboardView() {
  const sold = state.sales.filter((sale) => sale.date === "2026-09-07").reduce((sum, sale) => sum + sale.total, 0);
  const counts = Object.fromEntries(fiscalStates.map(([id]) => [id, state.sales.filter((sale) => sale.doc.status === id).length]));
  const tiles = [
    ["caixa", "PDV", state.sales.length, "Abrir venda", "coral"],
    ["produtos", "Produtos", state.products.length, "Catalogo ativo", "orange"],
    ["historico", "Vendas", money.format(sold), "Vendido hoje", "yellow"],
    ["documento", "Autorizados", counts.autorizado, "Fiscal OK", "green"],
    ["clientes", "Clientes", state.customers.length, "Base ficticia", "blue"],
    ["config", "Config fiscal", state.environment, "Ambiente atual", "purple"],
    ["estoque", "Estoque", state.products.reduce((sum, item) => sum + item.stock, 0), "Unidades mock", "dark"],
    ["documento", "Contingencia", counts.contingencia, "Aguardando transmissao", "teal"],
  ];
  return `
    <section class="tile-grid">
      ${tiles.map(([go, title, value, note, tone]) => `
        <button class="dash-tile ${tone}" data-go="${go}">
          <span>${title}</span>
          <strong>${value}</strong>
          <small>${note}</small>
        </button>
      `).join("")}
    </section>
    <section class="content-grid">
      <article class="panel">
        <header class="panel-header"><h2>Vendas da semana</h2><span class="badge authorized">Mock</span></header>
        <div class="panel-body chart">
          ${[35, 48, 28, 62, 80, 56, 74].map((height, i) => `<div class="bar"><span style="height:${height}%"></span><small>${["Seg","Ter","Qua","Qui","Sex","Sab","Dom"][i]}</small></div>`).join("")}
        </div>
      </article>
      <aside class="panel">
        <header class="panel-header"><h2>Atalhos rapidos</h2></header>
        <div class="panel-body quick-grid">
          <button class="btn coral" data-go="caixa">Abrir caixa e vender</button>
          <button class="btn success" data-go="produtos">Cadastrar produto</button>
          <button class="btn dark" data-go="documento">Ver estados fiscais</button>
          <button class="btn subtle" data-go="config">Configurar certificado</button>
        </div>
      </aside>
    </section>
  `;
}

function listView({ title, subtitle, kind, rows, columns }) {
  return `
    <section class="panel">
      <header class="panel-header">
        <div><span class="kicker">${subtitle}</span><h2>${title}</h2></div>
        <button class="btn success" data-open-modal="${kind}">Novo cadastro</button>
      </header>
      <div class="panel-body">
        <div class="toolbar">
          <input data-search="${kind}" placeholder="Buscar ${title.toLowerCase()}" />
          <button class="btn subtle" data-clear-search>Limpar</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr>${columns.map((col) => `<th>${col}</th>`).join("")}</tr></thead>
            <tbody data-table="${kind}">
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

function productsView(filter = "") {
  const rows = state.products
    .filter((item) => `${item.sku} ${item.name} ${item.category}`.toLowerCase().includes(filter.toLowerCase()))
    .map((item) => `<tr><td><strong>${item.sku}</strong></td><td>${item.name}</td><td>${item.category}</td><td>${money.format(item.price)}</td><td>${item.stock}</td></tr>`)
    .join("");
  return listView({ title: "Produtos", subtitle: "Catalogo mock", kind: "produto", columns: ["Codigo", "Produto", "Categoria", "Preco", "Estoque"], rows });
}

function customersView(filter = "") {
  const rows = state.customers
    .filter((item) => `${item.name} ${item.doc} ${item.phone}`.toLowerCase().includes(filter.toLowerCase()))
    .map((item) => `<tr><td><strong>${item.name}</strong></td><td>${item.doc}</td><td>${item.type}</td><td>${item.phone}</td></tr>`)
    .join("");
  return listView({ title: "Clientes", subtitle: "Pessoa fisica e juridica ficticia", kind: "cliente", columns: ["Nome", "Documento", "Tipo", "Telefone"], rows });
}

function suppliersView(filter = "") {
  const rows = state.suppliers
    .filter((item) => `${item.name} ${item.doc} ${item.contact}`.toLowerCase().includes(filter.toLowerCase()))
    .map((item) => `<tr><td><strong>${item.name}</strong></td><td>${item.doc}</td><td>${item.contact}</td></tr>`)
    .join("");
  return listView({ title: "Fornecedores", subtitle: "Cadastro simples", kind: "fornecedor", columns: ["Nome", "Documento", "Contato"], rows });
}

function cashierView() {
  const total = cartTotal();
  return `
    <section class="cashier-grid">
      <article class="panel">
        <header class="panel-header">
          <div><span class="kicker">Frente de caixa</span><h2>Produtos e atalhos</h2></div>
          <span class="badge pending">NF-e pendente</span>
        </header>
        <div class="panel-body">
          <div class="toolbar">
            <input id="product-search" placeholder="Digite codigo 1001, 1002 ou nome do produto" />
            <button class="btn success" id="add-product">Adicionar</button>
          </div>
          <div class="category-grid">
            ${categories.map((category, index) => `<button class="category-tile tone-${index % 4}" data-category="${category}">${category}</button>`).join("")}
          </div>
          <div class="product-grid">
            ${state.products.map((item) => `
              <button class="product-card ${item.color}" data-product="${item.id}">
                <strong>${item.name}</strong>
                <span>${item.category} · ${item.sku}</span>
                <b>${money.format(item.price)}</b>
                <small>${item.stock} em estoque</small>
              </button>
            `).join("")}
          </div>
        </div>
      </article>
      <aside class="panel order-panel">
        <header class="panel-header"><h2>Pedido atual</h2><span class="badge ${state.sefazOnline ? "authorized" : "contingency"}">${state.sefazOnline ? "SEFAZ online" : "Contingencia"}</span></header>
        <div class="panel-body form-grid">
          <div class="cart-list">
            ${cartRows().map((line, index) => `
              <article class="cart-item">
                <div><strong>${line.product.name}</strong><br><span>${line.product.sku} · ${money.format(line.product.price)}</span></div>
                <div class="qty"><button data-dec="${index}">-</button><strong>${line.qty}</strong><button data-inc="${index}">+</button></div>
              </article>
            `).join("") || `<article class="empty-cart"><strong>Nenhum item</strong><span>Toque em um produto para adicionar ao carrinho.</span></article>`}
          </div>
          <label>Cliente
            <select id="sale-customer">${state.customers.map((item) => `<option>${item.name}</option>`).join("")}</select>
          </label>
          <label>Forma de pagamento
            <select id="payment"><option>Pix</option><option>Credito</option><option>Debito</option><option>Dinheiro</option></select>
          </label>
          <label>Modelo fiscal
            <select id="doc-model"><option>NF-e</option><option>NFC-e</option><option>CT-e</option><option>MDF-e</option></select>
          </label>
          <dl class="totals">
            <div><dt>Subtotal</dt><dd>${money.format(total)}</dd></div>
            <div><dt>Tributos estimados</dt><dd>${money.format(total * 0.0925)}</dd></div>
            <div class="grand"><dt>Total</dt><dd>${money.format(total)}</dd></div>
          </dl>
          <div class="checkout-actions">
            <button class="btn danger" data-clear-cart>Excluir</button>
            <button class="btn dark" data-placeholder="Pedido salvo apenas no mockup">Pedido</button>
            ${state.emitting ? `<div class="spinner-row"><span class="spinner"></span><strong>Emitindo documento fiscal...</strong></div>` : `<button class="btn coral" id="finish-sale">Pagar e emitir</button>`}
          </div>
          ${state.lastSale ? `<div class="success-card"><strong>Venda ${state.lastSale.doc.status === "autorizado" ? "autorizada ✓" : "em contingencia"}</strong><span>${money.format(state.lastSale.total)} · ${state.lastSale.doc.model} ${state.lastSale.doc.number} emitida</span></div>` : ""}
        </div>
      </aside>
    </section>
  `;
}

function stockView() {
  return `
    <section class="content-grid">
      <article class="panel">
        <header class="panel-header"><h2>Estoque atual</h2><span class="badge authorized">Baixa mock</span></header>
        <div class="panel-body table-wrap">
          <table><thead><tr><th>Produto</th><th>Codigo</th><th>Estoque</th><th>Valor</th></tr></thead><tbody>
            ${state.products.map((item) => `<tr><td><strong>${item.name}</strong></td><td>${item.sku}</td><td>${item.stock}</td><td>${money.format(item.price)}</td></tr>`).join("")}
          </tbody></table>
        </div>
      </article>
      <aside class="panel">
        <header class="panel-header"><h2>Ultimas baixas</h2></header>
        <div class="panel-body stack">
          ${state.stockLog.map((log) => `<article class="stack-item"><strong>${log.item}</strong><span>${log.qty} un · ${log.source}</span><small>${log.when}</small></article>`).join("")}
        </div>
      </aside>
    </section>
  `;
}

function historyView() {
  return `
    <section class="panel">
      <header class="panel-header"><div><span class="kicker">Vendas e documentos</span><h2>Historico de vendas</h2></div></header>
      <div class="panel-body table-wrap">
        <table>
          <thead><tr><th>Data</th><th>Venda</th><th>Cliente</th><th>Total</th><th>Status fiscal</th></tr></thead>
          <tbody>
            ${state.sales.map((sale) => `<tr class="clickable" data-doc="${sale.id}"><td>${sale.date}</td><td><strong>${sale.doc.model} ${sale.doc.number}</strong></td><td>${sale.customer}</td><td>${money.format(sale.total)}</td><td><span class="badge ${statusClass(sale.doc.status)}">${statusLabel(sale.doc.status)}</span></td></tr>`).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function selectedSale() {
  return state.sales.find((sale) => sale.id === state.selectedDocId) || state.sales[0];
}

function documentView() {
  const sale = selectedSale();
  return `
    <section class="content-grid">
      <article class="panel">
        <header class="panel-header"><div><span class="kicker">Mapa fiscal</span><h2>11 estados do documento</h2></div></header>
        <div class="panel-body state-grid">
          ${fiscalStates.map(([id, label, desc]) => `<article class="state-card"><span class="badge ${statusClass(id)}">${label}</span><h3>${id}</h3><p>${desc}</p></article>`).join("")}
        </div>
      </article>
      <aside class="panel">
        <header class="panel-header"><h2>Documento selecionado</h2><span class="badge ${statusClass(sale.doc.status)}">${statusLabel(sale.doc.status)}</span></header>
        <div class="panel-body stack">
          <div class="receipt">
            <strong>AWTORIZEI FISCAL</strong><br>
            Modelo: ${sale.doc.model}<br>
            Serie: ${sale.doc.series}<br>
            Numero: ${sale.doc.number}<br>
            Chave: ${sale.doc.key}<br>
            Protocolo: ${sale.doc.protocol}<br>
            Total: ${money.format(sale.total)}
            <div class="receipt-footer">✓ NF-e AUTORIZADA</div>
          </div>
          <button class="btn success" data-placeholder="XML ficticio exibido">Ver XML</button>
          <button class="btn dark" data-placeholder="DANFE ficticio exibido">Ver DANFE</button>
        </div>
      </aside>
    </section>
  `;
}

function configView() {
  return `
    <section class="content-grid">
      <article class="panel">
        <header class="panel-header"><div><span class="kicker">Ambiente fiscal</span><h2>Configuracao fiscal</h2></div></header>
        <div class="panel-body form-grid">
          <label>Certificado A1
            <input type="file" accept=".pfx,.p12" />
          </label>
          <label>Serie NF-e
            <input value="1" />
          </label>
          <label>Serie NFC-e
            <input value="2" />
          </label>
          <label>CSC / token
            <input type="password" value="token-ficticio-nao-real" />
          </label>
          <button class="btn success" data-placeholder="Configuracao fiscal salva no mockup">Salvar configuracao</button>
        </div>
      </article>
      <aside class="panel">
        <header class="panel-header"><h2>Homologacao / Producao</h2></header>
        <div class="panel-body stack">
          <div class="toggle">
            <button class="${state.environment === "Homologacao" ? "active" : ""}" data-env="Homologacao">Homologacao</button>
            <button class="${state.environment === "Producao" ? "active" : ""}" data-env="Producao">Producao</button>
          </div>
          <p>Ambiente atual: <strong>${state.environment}</strong>. Este toggle e apenas visual e nao conecta em SEFAZ real.</p>
        </div>
      </aside>
    </section>
  `;
}

function openRegisterModal(kind) {
  const configs = {
    produto: ["Novo produto", ["Codigo", "Nome do produto", "Categoria", "Preco", "Estoque"]],
    cliente: ["Novo cliente", ["Nome", "CPF/CNPJ ficticio", "Telefone"]],
    fornecedor: ["Novo fornecedor", ["Nome", "CNPJ ficticio", "Contato"]],
  };
  const [title, fields] = configs[kind];
  state.modalMode = kind;
  $("#modal-title").textContent = title;
  $("#modal-kicker").textContent = "Cadastro mock";
  $("#modal-body").innerHTML = `
    <div class="form-grid">
      ${fields.map((field, index) => `<label>${field}<input data-modal-field="${index}" /></label>`).join("")}
      <button class="btn success" type="button" id="save-modal">Salvar no mockup</button>
    </div>
  `;
  $("#modal").showModal();
}

function saveModal() {
  const values = [...document.querySelectorAll("[data-modal-field]")].map((input) => input.value.trim());
  if (state.modalMode === "produto") {
    state.products.push({ id: Date.now(), sku: values[0] || "1999", name: values[1] || "Produto novo ficticio", category: values[2] || "Demo", price: Number(values[3] || 99.9), stock: Number(values[4] || 3) });
  }
  if (state.modalMode === "cliente") {
    state.customers.push({ id: Date.now(), name: values[0] || "Cliente novo ficticio", doc: values[1] || "000.000.000-00", phone: values[2] || "(54) 90000-9999", type: "Documento ficticio" });
  }
  if (state.modalMode === "fornecedor") {
    state.suppliers.push({ id: Date.now(), name: values[0] || "Fornecedor novo ficticio", doc: values[1] || "00.000.000/0001-00", contact: values[2] || "demo@local" });
  }
  $("#modal").close();
  render();
  toast("Cadastro salvo apenas no mockup.");
}

function addProduct() {
  const query = $("#product-search").value.toLowerCase().trim();
  const product = state.products.find((item) => item.sku === query || item.name.toLowerCase().includes(query)) || state.products[0];
  addProductById(product.id);
}

function addProductById(productId) {
  const product = state.products.find((item) => item.id === Number(productId)) || state.products[0];
  const line = state.cart.find((item) => item.productId === product.id);
  if (line) line.qty += 1;
  else state.cart.push({ productId: product.id, qty: 1 });
  render();
  toast(`${product.name} adicionado.`);
}

function finishSale() {
  if (!state.cart.length) return toast("Carrinho vazio.");
  state.emitting = true;
  state.lastSale = null;
  render();
  window.setTimeout(() => {
    const total = cartTotal();
    const number = `000.${482 + state.sales.length}`;
    const status = state.sefazOnline ? "autorizado" : "contingencia";
    const sale = {
      id: `sale-${Date.now()}`,
      number,
      date: new Date().toISOString().slice(0, 10),
      customer: $("#sale-customer").value,
      total,
      payment: $("#payment").value,
      doc: {
        model: $("#doc-model").value,
        series: "1",
        number,
        status,
        key: `CHAVE-FICTICIA-${number}`,
        protocol: state.sefazOnline ? `PROTOCOLO-FICTICIO-${number}` : "PROTOCOLO-CONTINGENCIA-FICTICIO",
      },
    };
    cartRows().forEach((line) => {
      line.product.stock = Math.max(0, line.product.stock - line.qty);
      state.stockLog.unshift({ item: line.product.name, qty: -line.qty, source: `Venda ${sale.doc.model} ${sale.doc.number}`, when: "Agora" });
    });
    state.sales.unshift(sale);
    state.selectedDocId = sale.id;
    state.cart = [];
    state.lastSale = sale;
    state.emitting = false;
    render();
    toast(state.sefazOnline ? "Venda autorizada e estoque baixado." : "Venda em contingencia e estoque baixado.");
  }, 2400);
}

function bindViewEvents() {
  document.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => setView(button.dataset.go)));
  document.querySelectorAll("[data-open-modal]").forEach((button) => button.addEventListener("click", () => openRegisterModal(button.dataset.openModal)));
  document.querySelectorAll("[data-search]").forEach((input) => input.addEventListener("input", () => {
    const kind = input.dataset.search;
    if (kind === "produto") $("#view").innerHTML = productsView(input.value);
    if (kind === "cliente") $("#view").innerHTML = customersView(input.value);
    if (kind === "fornecedor") $("#view").innerHTML = suppliersView(input.value);
    bindViewEvents();
  }));
  document.querySelectorAll("[data-clear-search]").forEach((button) => button.addEventListener("click", () => render()));
  document.querySelectorAll("[data-inc]").forEach((button) => button.addEventListener("click", () => { state.cart[Number(button.dataset.inc)].qty += 1; render(); }));
  document.querySelectorAll("[data-dec]").forEach((button) => button.addEventListener("click", () => { state.cart[Number(button.dataset.dec)].qty = Math.max(1, state.cart[Number(button.dataset.dec)].qty - 1); render(); }));
  document.querySelectorAll("[data-doc]").forEach((row) => row.addEventListener("click", () => { state.selectedDocId = row.dataset.doc; setView("documento"); }));
  document.querySelectorAll("[data-env]").forEach((button) => button.addEventListener("click", () => { state.environment = button.dataset.env; render(); toast(`Ambiente alterado para ${state.environment}.`); }));
  document.querySelectorAll("[data-placeholder]").forEach((button) => button.addEventListener("click", () => toast(button.dataset.placeholder)));
  document.querySelectorAll("[data-product]").forEach((button) => button.addEventListener("click", () => addProductById(button.dataset.product)));
  document.querySelectorAll("[data-category]").forEach((button) => button.addEventListener("click", () => {
    $("#product-search").value = button.dataset.category;
    toast(`Categoria ${button.dataset.category} selecionada.`);
  }));
  $("[data-clear-cart]")?.addEventListener("click", () => {
    state.cart = [];
    render();
    toast("Carrinho limpo apenas no mockup.");
  });
  $("#add-product")?.addEventListener("click", addProduct);
  $("#product-search")?.addEventListener("keydown", (event) => { if (event.key === "Enter") addProduct(); });
  $("#finish-sale")?.addEventListener("click", finishSale);
  $("#save-modal")?.addEventListener("click", saveModal);
}

$("#login-form").addEventListener("submit", (event) => {
  event.preventDefault();
  state.logged = true;
  $("#login-screen").classList.add("hidden");
  $("#app-shell").classList.remove("hidden");
  renderNav();
  render();
});

$("#nav").addEventListener("click", (event) => {
  const button = event.target.closest("[data-view]");
  if (button) setView(button.dataset.view);
});

$("#toggle-contingency").addEventListener("click", () => {
  state.sefazOnline = !state.sefazOnline;
  render();
});

const INITIAL = {
  settings: {
    profitGoal: 1450,
    defaultPrice: 15,
    defaultCostPerKg: 95,
    gramsPerBag: 60,
    autoCalculation: true
  },

  inventory: [
    {
      id: "bolsitas",
      name: "Bolsitas",
      quantity: 0,
      unit: "unidades",
      avgCost: 0,
      lowThreshold: 20
    },
    {
      id: "gomitas",
      name: "Gomitas",
      quantity: 0,
      unit: "kg",
      avgCost: 0,
      lowThreshold: 0.5
    },
    {
      id: "gusanos",
      name: "Gusanos",
      quantity: 0,
      unit: "kg",
      avgCost: 0,
      lowThreshold: 0.5
    },
    {
      id: "panditas",
      name: "Panditas",
      quantity: 0,
      unit: "kg",
      avgCost: 0,
      lowThreshold: 0.5
    },
    {
      id: "chamoy",
      name: "Chamoy",
      quantity: 0,
      unit: "ml",
      avgCost: 0,
      lowThreshold: 100
    },
    {
      id: "miguelito",
      name: "Miguelito",
      quantity: 0,
      unit: "g",
      avgCost: 0,
      lowThreshold: 50
    }
  ],

  sales: [],
  purchases: [],
  transactions: []
};

function cloneInitial() {
  return JSON.parse(JSON.stringify(INITIAL));
}

function load() {
  try {
    const raw = localStorage.getItem("gummyware_v1");

    if (!raw) {
      return cloneInitial();
    }

    const old = JSON.parse(raw);
    const base = cloneInitial();

    return {
      ...base,
      ...old,

      settings: {
        ...base.settings,
        ...(old.settings || {})
      },

      inventory: Array.isArray(old.inventory)
        ? old.inventory
        : base.inventory,

      sales: Array.isArray(old.sales)
        ? old.sales
        : [],

      purchases: Array.isArray(old.purchases)
        ? old.purchases
        : [],

      transactions: Array.isArray(old.transactions)
        ? old.transactions
        : []
    };

  } catch {
    return cloneInitial();
  }
}

let state = load();
let screen = "home";

const root = document.querySelector("#root");

const fmt = n =>
  "$" +
  (Number(n) || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

const qty = (n, u) =>
  `${Number(n) % 1 === 0 ? Number(n) : Number(n).toFixed(2)} ${u}`;

const uid = () =>
  Date.now().toString(36) +
  Math.random().toString(36).slice(2);

function save() {
  localStorage.setItem("gummyware_v1", JSON.stringify(state));
}

function stats() {
  const sales = state.sales.reduce(
    (a, x) => a + (Number(x.total) || 0),
    0
  );

  const purchases = state.purchases.reduce(
    (a, x) => a + (Number(x.cost) || 0),
    0
  );

  const profit = state.sales.reduce(
    (a, x) => a + (Number(x.profit) || 0),
    0
  );

  return {
    totalSales: sales,
    totalPurchases: purchases,
    totalProfit: profit,
    availableMoney: sales - purchases,

    goalProgress: state.settings.profitGoal
      ? Math.min(
          profit / state.settings.profitGoal,
          1
        )
      : 0,

    restockReserve:
      state.sales.reduce(
        (a, x) => a + (Number(x.forRestock) || 0),
        0
      ) - purchases
  };
}

/* =========================================================
   NAVEGACIÓN
========================================================= */

function nav() {
  return `
    <nav class="bottom-nav">

      <button
        class="nav-item ${screen === "home" ? "active" : ""}"
        onclick="go('home')"
      >
        <span class="nav-icon">⌂</span>
        <span>Inicio</span>
      </button>

      <button
        class="nav-item ${
          screen === "history" || screen === "new-sale"
            ? "active"
            : ""
        }"
        onclick="go('history')"
      >
        <span class="nav-icon">↗</span>
        <span>Ventas</span>
      </button>

      <div class="fab-wrap">
        <button
          class="fab"
          onclick="go('new-sale')"
          aria-label="Nueva venta"
        >
          ＋
        </button>
      </div>

      <button
        class="nav-item ${
          screen === "calculator"
            ? "active"
            : ""
        }"
        onclick="go('calculator')"
      >
        <span class="nav-icon">▣</span>
        <span>Calc</span>
      </button>

      <button
        class="nav-item ${
          ["settings", "distribution"].includes(screen)
            ? "active"
            : ""
        }"
        onclick="go('settings')"
      >
        <span class="nav-icon">☰</span>
        <span>Más</span>
      </button>

    </nav>
  `;
}

function shell(content) {
  root.innerHTML = `
    <div class="app-shell">

      <main class="screen-content">
        ${content}
      </main>

      ${nav()}

    </div>
  `;

  updateInstallUI();
}

function header(title, subtitle, back = false) {
  return `
    <header class="header">

      ${
        back
          ? `
            <button
              class="ghost back-button"
              onclick="go('home')"
            >
              ‹ Volver
            </button>
          `
          : ""
      }

      <h1>${title}</h1>

      ${
        subtitle
          ? `<p>${subtitle}</p>`
          : ""
      }

    </header>
  `;
}

/* =========================================================
   INSTALACIÓN PWA
========================================================= */

let deferredInstallPrompt = null;

function isStandalone() {
  return (
    window.matchMedia(
      "(display-mode: standalone)"
    ).matches ||
    window.navigator.standalone === true
  );
}

function isIOS() {
  return (
    /iPad|iPhone|iPod/.test(
      navigator.userAgent
    ) ||
    (
      navigator.platform === "MacIntel" &&
      navigator.maxTouchPoints > 1
    )
  );
}

window.addEventListener(
  "beforeinstallprompt",
  event => {
    event.preventDefault();
    deferredInstallPrompt = event;
    updateInstallUI();
  }
);

window.addEventListener(
  "appinstalled",
  () => {
    deferredInstallPrompt = null;
    updateInstallUI();
    toast("GummyWare se instaló correctamente");
  }
);

function installCard() {
  return `
    <div
      class="install-card"
      id="install-card"
    >

      <div class="install-icon">
        📲
      </div>

      <div class="install-content">

        <strong class="install-title">
          Instalar GummyWare
        </strong>

        <span class="install-hint">
          Usa GummyWare como una aplicación.
        </span>

      </div>

      <button
        class="install-button"
        onclick="installApp()"
      >
        Instalar
      </button>

    </div>
  `;
}

function updateInstallUI() {
  const cards =
    document.querySelectorAll(
      ".install-card"
    );

  if (!cards.length) {
    return;
  }

  if (isStandalone()) {
    cards.forEach(card => {
      card.style.display = "none";
    });

    return;
  }

  cards.forEach(card => {
    card.style.display = "flex";

    const title =
      card.querySelector(".install-title");

    const hint =
      card.querySelector(".install-hint");

    const button =
      card.querySelector(".install-button");

    if (isIOS()) {
      title.textContent =
        "Instalar GummyWare";

      hint.textContent =
        "Añádela a tu pantalla de inicio.";

      button.textContent =
        "Cómo instalar";

    } else if (deferredInstallPrompt) {
      title.textContent =
        "Instalar GummyWare";

      hint.textContent =
        "Instala la aplicación en tu dispositivo.";

      button.textContent =
        "Instalar";

    } else {
      title.textContent =
        "Instalar GummyWare";

      hint.textContent =
        "Puedes instalarla desde tu navegador.";

      button.textContent =
        "Instalar";
    }
  });
}

async function installApp() {

  if (isStandalone()) {
    toast("GummyWare ya está instalada");
    return;
  }

  if (deferredInstallPrompt) {

    try {

      await deferredInstallPrompt.prompt();

      const result =
        await deferredInstallPrompt.userChoice;

      if (
        result &&
        result.outcome === "accepted"
      ) {
        toast("Instalando GummyWare...");
      }

    } catch {
      toast("No se pudo iniciar la instalación");
    }

    deferredInstallPrompt = null;

    updateInstallUI();

    return;
  }

  if (isIOS()) {

    modal(`
      <h2>Instalar GummyWare</h2>

      <p class="modal-text">
        En iPhone o iPad, sigue estos pasos:
      </p>

      <div class="install-steps">

        <div>
          <b>1.</b>
          Toca el botón
          <b>Compartir</b>
          del navegador.
        </div>

        <div>
          <b>2.</b>
          Busca
          <b>“Añadir a pantalla de inicio”</b>.
        </div>

        <div>
          <b>3.</b>
          Pulsa
          <b>“Añadir”</b>.
        </div>

      </div>

      <button
        class="primary full"
        onclick="closeModal()"
      >
        Entendido
      </button>
    `);

    return;
  }

  modal(`
    <h2>Instalar GummyWare</h2>

    <p class="modal-text">
      Si tu navegador todavía no muestra
      automáticamente la instalación:
    </p>

    <div class="install-steps">

      <div>
        <b>Chrome / Edge:</b>
        busca el icono de instalación
        en la barra de direcciones.
      </div>

      <div>
        También puedes abrir el menú
        <b>⋮</b> y buscar
        <b>“Instalar GummyWare”</b>.
      </div>

    </div>

    <button
      class="primary full"
      onclick="closeModal()"
    >
      Entendido
    </button>
  `);
}

/* =========================================================
   INICIO
========================================================= */

function home() {

  const s = stats();

  const reached =
    s.totalProfit >=
      state.settings.profitGoal &&
    state.settings.profitGoal > 0;

  return `
    ${header(
      "GummyWare",
      "Tu antojo, bajo control."
    )}

    <div class="px">

      <div class="card">

        <div class="row">

          <div>

            <div class="stat-label">
              Meta de ganancia
            </div>

            <div
              class="big-number"
            >
              ${fmt(
                state.settings.profitGoal
              )}
            </div>

          </div>

          <button
            class="secondary"
            onclick="goalModal()"
          >
            Editar
          </button>

        </div>

        ${
          reached
            ? `
              <div class="goal-reached">
                ¡Meta alcanzada! 🎊

                <br>

                <span>
                  Ganancia:
                  ${fmt(s.totalProfit)}
                </span>
              </div>
            `
            : `
              <div class="progress-wrap">

                <div class="progress">
                  <div
                    style="
                      width:${s.goalProgress * 100}%
                    "
                  ></div>
                </div>

                <div
                  class="row small muted progress-info"
                >
                  <span>
                    Ganancia actual
                  </span>

                  <b>
                    ${fmt(s.totalProfit)}
                  </b>
                </div>

              </div>
            `
        }

      </div>

      <div class="grid2">

        <div class="card">

          <div class="stat-label">
            Ventas
          </div>

          <div class="stat-value">
            ${fmt(s.totalSales)}
          </div>

          <div class="small muted stat-foot">
            ${state.sales.length}
            ventas
          </div>

        </div>

        <div class="card">

          <div class="stat-label">
            Ganancia neta
          </div>

          <div
            class="stat-value"
            style="
              color:${
                s.totalProfit < 0
                  ? "var(--red)"
                  : "var(--green)"
              }
            "
          >
            ${fmt(s.totalProfit)}
          </div>

        </div>

      </div>

      <div class="card">

        <div class="stat-label">
          Disponible
        </div>

        <div class="stat-value">
          ${fmt(s.availableMoney)}
        </div>

      </div>

      ${
        state.transactions.length
          ? `
            <div class="section-head">
              <h2>Reciente</h2>

              <button
                onclick="go('history')"
              >
                Ver todo
              </button>
            </div>

            ${state.transactions
              .slice(0, 5)
              .map(
                tx => `
                  <div class="list-item">

                    <div class="list-icon">
                      ${
                        tx.type === "sale"
                          ? "↗"
                          : "↙"
                      }
                    </div>

                    <div
                      class="list-main"
                    >

                      <b>
                        ${tx.description}
                      </b>

                      <div class="small muted">
                        ${new Date(
                          tx.date
                        ).toLocaleDateString(
                          "es-MX",
                          {
                            day: "numeric",
                            month: "short"
                          }
                        )}
                      </div>

                    </div>

                    <b
                      class="${
                        tx.amount >= 0
                          ? "amount-positive"
                          : "amount-negative"
                      }"
                    >
                      ${
                        tx.amount >= 0
                          ? "+"
                          : ""
                      }${fmt(tx.amount)}
                    </b>

                  </div>
                `
              )
              .join("")}
          `
          : `
            <div class="card welcome-card">

              <div class="welcome-icon">
                🍬
              </div>

              <b>
                ¡Bienvenida a GummyWare!
              </b>

              <p class="muted small">
                Registra tu primera venta
                o compra para comenzar.
              </p>

            </div>
          `
      }

      <div class="home-actions">

        <button
          class="primary full"
          onclick="go('new-sale')"
        >
          ＋ Nueva venta
        </button>

        <button
          class="secondary full"
          onclick="go('new-purchase')"
        >
          ＋ Nueva compra
        </button>

      </div>

    </div>
  `;
}

/* =========================================================
   NUEVA VENTA
========================================================= */

function newSale() {

  const stockItem =
    state.inventory.find(
      x => x.id === "bolsitas"
    );

  const stock =
    stockItem?.quantity || 0;

  return `
    ${header(
      "Nueva venta",
      "Registra una venta",
      true
    )}

    <div class="px">

      <div class="card">

        <div class="field">

          <label>
            Bolsitas
          </label>

          <input
            id="sale-bags"
            class="input"
            type="number"
            min="1"
            inputmode="decimal"
            value="20"
          >

        </div>

        <div class="field">

          <label>
            Precio por bolsita
          </label>

          <input
            id="sale-price"
            class="input"
            type="number"
            min="0"
            inputmode="decimal"
            value="${state.settings.defaultPrice}"
          >

        </div>

        ${
          stock > 0 && stock <= 20
            ? `
              <div class="badge warn">
                ⚠️ Stock bajo
                (${stock} bolsitas)
              </div>
            `
            : stock === 0
            ? `
              <div class="badge danger">
                Sin bolsitas en inventario
              </div>
            `
            : ""
        }

        <div class="calculation-box">

          <div class="stat-label">
            Costo de producto
          </div>

          <div
            id="sale-cost"
            class="calculation-value"
          >
            ${fmt(
              20 *
                state.settings.gramsPerBag /
                1000 *
                state.settings.defaultCostPerKg
            )}
          </div>

          <div class="small muted">
            Calculado automáticamente
          </div>

        </div>

        <div class="sale-summary">

          <div class="stat-label">
            Resumen
          </div>

          <div
            class="row summary-row"
          >
            <span>
              Venta total
            </span>

            <b id="sale-total">
              ${fmt(
                20 *
                  state.settings.defaultPrice
              )}
            </b>
          </div>

          <div
            class="row summary-row"
          >
            <span>
              Ganancia estimada
            </span>

            <b id="sale-profit">
              $0
            </b>
          </div>

        </div>

      </div>

      <button
        class="primary full"
        onclick="saveSale()"
      >
        Registrar venta
      </button>

    </div>
  `;
}

function updateSale() {

  const bags =
    Number(
      document.querySelector(
        "#sale-bags"
      )?.value
    ) || 0;

  const price =
    Number(
      document.querySelector(
        "#sale-price"
      )?.value
    ) || 0;

  const cost =
    bags *
    state.settings.gramsPerBag /
    1000 *
    state.settings.defaultCostPerKg;

  const total =
    bags * price;

  const profit =
    total - cost;

  const totalElement =
    document.querySelector(
      "#sale-total"
    );

  const costElement =
    document.querySelector(
      "#sale-cost"
    );

  const profitElement =
    document.querySelector(
      "#sale-profit"
    );

  if (totalElement)
    totalElement.textContent =
      fmt(total);

  if (costElement)
    costElement.textContent =
      fmt(cost);

  if (profitElement) {
    profitElement.textContent =
      fmt(profit);

    profitElement.style.color =
      profit >= 0
        ? "var(--green)"
        : "var(--red)";
  }
}

function saveSale() {

  const bags =
    Number(
      document.querySelector(
        "#sale-bags"
      ).value
    ) || 0;

  const price =
    Number(
      document.querySelector(
        "#sale-price"
      ).value
    ) || 0;

  if (bags <= 0 || price <= 0) {
    toast(
      "Ingresa la cantidad y el precio"
    );

    return;
  }

  const cost =
    bags *
    state.settings.gramsPerBag /
    1000 *
    state.settings.defaultCostPerKg;

  const total =
    bags * price;

  const profit =
    total - cost;

  const sale = {
    id: uid(),
    date: new Date().toISOString(),
    bagsCount: bags,
    pricePerBag: price,
    total,
    costUsed: cost,
    profit,
    forRestock: cost,
    isAutoCalc: true
  };

  state.sales.unshift(sale);

  const inventory =
    state.inventory.find(
      x => x.id === "bolsitas"
    );

  if (inventory) {
    inventory.quantity =
      Math.max(
        0,
        inventory.quantity - bags
      );
  }

  state.transactions.unshift({
    id: uid(),
    date: sale.date,
    type: "sale",
    description:
      `Venta de ${bags} bolsita${
        bags !== 1 ? "s" : ""
      }`,
    amount: total,
    saleId: sale.id
  });

  save();

  toast("Venta registrada");

  go("home");
}

/* =========================================================
   COMPRAS
========================================================= */

function purchase() {

  return `
    ${header(
      "Nueva compra",
      "Registra una compra",
      true
    )}

    <div class="px">

      <div class="card">

        <div class="field">

          <label>
            Producto
          </label>

          <select
            id="p-product"
            class="input"
          >
            <option>Gomitas</option>
            <option>Bolsitas</option>
            <option>Gusanos</option>
            <option>Panditas</option>
            <option>Tiburones</option>
            <option>Chamoy</option>
            <option>Miguelito</option>
            <option>Otro</option>
          </select>

        </div>

        <div class="grid2">

          <div class="field">

            <label>
              Cantidad
            </label>

            <input
              id="p-qty"
              class="input"
              type="number"
              value="1"
            >

          </div>

          <div class="field">

            <label>
              Unidad
            </label>

            <select
              id="p-unit"
              class="input"
            >
              <option>kg</option>
              <option>unidades</option>
              <option>g</option>
              <option>ml</option>
              <option>paquetes</option>
            </select>

          </div>

        </div>

        <div class="field">

          <label>
            Costo total
          </label>

          <input
            id="p-cost"
            class="input"
            type="number"
            inputmode="decimal"
            placeholder="$0"
          >

        </div>

        <div class="info-box">
          Esta compra se registra como inventario
          del negocio. El gasto se refleja
          en tu dinero disponible.
        </div>

      </div>

      <button
        class="primary full"
        onclick="savePurchase()"
      >
        Guardar compra
      </button>

    </div>
  `;
}

function savePurchase() {

  const product =
    document.querySelector(
      "#p-product"
    ).value;

  const quantity =
    Number(
      document.querySelector(
        "#p-qty"
      ).value
    ) || 0;

  const unit =
    document.querySelector(
      "#p-unit"
    ).value;

  const cost =
    Number(
      document.querySelector(
        "#p-cost"
      ).value
    ) || 0;

  if (
    quantity <= 0 ||
    cost <= 0
  ) {
    toast(
      "Completa todos los campos"
    );

    return;
  }

  const purchase = {
    id: uid(),
    date: new Date().toISOString(),
    product,
    quantity,
    unit,
    cost
  };

  state.purchases.unshift(
    purchase
  );

  const item =
    state.inventory.find(
      x =>
        x.name.toLowerCase() ===
        product.toLowerCase()
    );

  if (item) {

    const totalValue =
      item.quantity *
        item.avgCost +
      cost;

    const newQuantity =
      item.quantity + quantity;

    item.avgCost =
      newQuantity
        ? totalValue / newQuantity
        : 0;

    item.quantity =
      newQuantity;
  }

  state.transactions.unshift({
    id: uid(),
    date: purchase.date,
    type: "purchase",
    description:
      `Compra de ${quantity} ${unit} de ${product}`,
    amount: -cost,
    purchaseId: purchase.id
  });

  save();

  toast("Compra registrada");

  go("inventory");
}

/* =========================================================
   INVENTARIO
========================================================= */

function inventory() {

  const low =
    state.inventory.filter(
      i =>
        i.quantity > 0 &&
        i.quantity <=
          i.lowThreshold
    );

  return `
    ${header(
      "Inventario",
      "Tu stock actual"
    )}

    <div class="px">

      ${
        low.length
          ? `
            <div class="card stock-warning">

              <b>
                Stock bajo
              </b>

              <div class="small">
                ${low
                  .map(i => i.name)
                  .join(", ")}
                ${
                  low.length === 1
                    ? " necesita"
                    : " necesitan"
                }
                reposición.
              </div>

            </div>
          `
          : ""
      }

      <div
        class="card inventory-card"
      >

        ${state.inventory
          .map(
            item => `
              <div class="list-item">

                <div class="list-icon">
                  ${
                    item.name === "Bolsitas"
                      ? "▣"
                      : "🍬"
                  }
                </div>

                <div
                  class="list-main"
                >

                  <b>
                    ${item.name}
                  </b>

                  <div class="small muted">
                    Costo prom:
                    ${fmt(item.avgCost)}
                    /${item.unit}
                  </div>

                </div>

                <div class="inventory-right">

                  <b>
                    ${qty(
                      item.quantity,
                      item.unit
                    )}
                  </b>

                  <span
                    class="badge ${
                      item.quantity === 0
                        ? "danger"
                        : item.quantity <=
                          item.lowThreshold
                        ? "warn"
                        : "success"
                    }"
                  >
                    ${
                      item.quantity === 0
                        ? "Agotado"
                        : item.quantity <=
                          item.lowThreshold
                        ? "Stock bajo"
                        : "Disponible"
                    }
                  </span>

                </div>

              </div>
            `
          )
          .join("")}

      </div>

      <button
        class="primary full"
        onclick="go('new-purchase')"
      >
        ＋ Nueva compra
      </button>

    </div>
  `;
}

/* =========================================================
   HISTORIAL
========================================================= */

function history() {

  const s = stats();

  return `
    ${header(
      "Historial",
      "Todos tus movimientos"
    )}

    <div class="px">

      <div class="grid2">

        <div class="card">
          <div class="stat-label">
            Ventas totales
          </div>

          <div class="stat-value">
            ${fmt(s.totalSales)}
          </div>

          <div class="small muted">
            ${state.sales.length}
            ventas
          </div>
        </div>

        <div class="card">
          <div class="stat-label">
            Compras totales
          </div>

          <div class="stat-value">
            ${fmt(s.totalPurchases)}
          </div>

          <div class="small muted">
            ${state.purchases.length}
            compras
          </div>
        </div>

        <div class="card">
          <div class="stat-label">
            Ganancia neta
          </div>

          <div
            class="stat-value"
            style="color:var(--green)"
          >
            ${fmt(s.totalProfit)}
          </div>
        </div>

        <div class="card">
          <div class="stat-label">
            Disponible
          </div>

          <div class="stat-value">
            ${fmt(s.availableMoney)}
          </div>
        </div>

      </div>

    </div>

    <div class="section-head">
      <h2>
        Movimientos
      </h2>
    </div>

    <div
      class="card inventory-card"
    >

      ${
        state.transactions.length
          ? state.transactions
              .map(
                tx => `
                  <div class="list-item">

                    <div class="list-icon">
                      ${
                        tx.type === "sale"
                          ? "↗"
                          : "↙"
                      }
                    </div>

                    <div class="list-main">

                      <b>
                        ${tx.description}
                      </b>

                      <div class="small muted">
                        ${new Date(
                          tx.date
                        ).toLocaleDateString(
                          "es-MX",
                          {
                            day: "numeric",
                            month: "short"
                          }
                        )}
                        ·
                        ${new Date(
                          tx.date
                        ).toLocaleTimeString(
                          "es-MX",
                          {
                            hour: "2-digit",
                            minute: "2-digit"
                          }
                        )}
                      </div>

                    </div>

                    <b
                      class="${
                        tx.amount >= 0
                          ? "amount-positive"
                          : "amount-negative"
                      }"
                    >
                      ${
                        tx.amount >= 0
                          ? "+"
                          : ""
                      }${fmt(tx.amount)}
                    </b>

                  </div>
                `
              )
              .join("")
          : `
            <div class="empty">
              Aún no hay movimientos.
            </div>
          `
      }

    </div>
  `;
}

/* =========================================================
   CALCULADORA
========================================================= */

window.calcMode = "business";
window.calcDisplay = "0";
window.calcPrev = null;
window.calcOp = null;
window.calcFresh = false;

function calculator() {

  return `
    ${header(
      "Calculadora",
      "Estima tus ganancias"
    )}

    <div class="px">

      <div class="card">

        <div class="calculator-tabs">

          <button
            class="${
              window.calcMode === "business"
                ? "active"
                : ""
            }"
            onclick="
              window.calcMode='business';
              go('calculator')
            "
          >
            Negocio
          </button>

          <button
            class="${
              window.calcMode === "basic"
                ? "active"
                : ""
            }"
            onclick="
              window.calcMode='basic';
              go('calculator')
            "
          >
            Calculadora
          </button>

        </div>

        ${
          window.calcMode === "basic"
            ? basicCalc()
            : businessCalc()
        }

      </div>

    </div>
  `;
}

function businessCalc() {

  const b =
    window.calcB || 35;

  const p =
    window.calcP ||
    state.settings.defaultPrice;

  const c =
    window.calcC ?? "";

  const e =
    window.calcE || 0;

  const auto =
    b *
    state.settings.gramsPerBag /
    1000 *
    state.settings.defaultCostPerKg;

  const cost =
    c === ""
      ? auto
      : Number(c) || 0;

  const total =
    b * p;

  const profit =
    total - cost - e;

  const per =
    b
      ? profit / b
      : 0;

  const remain =
    Math.max(
      state.settings.profitGoal -
        stats().totalProfit,
      0
    );

  const need =
    per > 0
      ? Math.ceil(
          remain / per
        )
      : 0;

  const days =
    b > 0
      ? Math.ceil(
          need / b
        )
      : 0;

  return `
    <div class="stat-label">
      Simulación de venta
    </div>

    <div class="field calculator-field">

      <label>
        Bolsitas a vender
      </label>

      <input
        class="input"
        type="number"
        value="${b}"
        oninput="
          window.calcB=Number(this.value)||0;
          go('calculator')
        "
      >

    </div>

    <div class="field">

      <label>
        Precio por bolsita
      </label>

      <input
        class="input"
        type="number"
        value="${p}"
        oninput="
          window.calcP=Number(this.value)||0;
          go('calculator')
        "
      >

    </div>

    <div class="field">

      <label>
        Costo del producto
      </label>

      <input
        class="input"
        type="number"
        value="${c}"
        placeholder="Calculado automático"
        oninput="
          window.calcC=this.value;
          go('calculator')
        "
      >

    </div>

    <div class="field">

      <label>
        Otros costos
      </label>

      <input
        class="input"
        type="number"
        value="${e}"
        oninput="
          window.calcE=Number(this.value)||0;
          go('calculator')
        "
      >

    </div>

    <div class="calculator-result">

      <div class="row">
        <span>
          Venta total
        </span>

        <b>
          ${fmt(total)}
        </b>
      </div>

      <div class="row result-row">
        <span>
          Costo total
        </span>

        <b class="amount-negative">
          −${fmt(cost + e)}
        </b>
      </div>

      <hr>

      <div class="row">

        <b>
          Ganancia estimada
        </b>

        <b
          class="calculator-profit"
          style="
            color:${
              profit >= 0
                ? "var(--green)"
                : "var(--red)"
            }
          "
        >
          ${fmt(profit)}
        </b>

      </div>

      <div class="small muted result-per">
        ${fmt(per)}
        por bolsita
      </div>

    </div>

    ${
      remain > 0 && per > 0
        ? `
          <div class="goal-calculation">

            <b>
              ¿Cuánto necesito vender?
            </b>

            <p>
              Necesitas vender aproximadamente
              <strong>${b}</strong>
              bolsitas al día durante
              <strong>${days}</strong>
              días.
            </p>

            <div class="grid2">

              <div class="badge neutral">
                Meta restante<br>
                ${fmt(remain)}
              </div>

              <div class="badge neutral">
                Bolsitas necesarias<br>
                ${need}
              </div>

            </div>

          </div>
        `
        : ""
    }
  `;
}

function basicCalc() {

  const keys = [
    "C", "%", "÷", "×",

    "7", "8", "9", "−",

    "4", "5", "6", "+",

    "1", "2", "3", "=",

    "0", ".", ""
  ];

  return `
    <div class="calc-display">

      <div class="value">
        ${window.calcDisplay || "0"}
      </div>

    </div>

    <div class="keys">

      ${keys
        .map(k => {

          if (k === "") {
            return `
              <button
                class="key blank"
                tabindex="-1"
                aria-hidden="true"
              ></button>
            `;
          }

          const classes = [
            "key"
          ];

          if (
            ["÷", "×", "−", "+"]
              .includes(k)
          ) {
            classes.push("op");
          }

          if (
            ["C", "%"]
              .includes(k)
          ) {
            classes.push("special");
          }

          if (k === "=") {
            classes.push("equal");
          }

          if (k === "0") {
            classes.push("zero");
          }

          return `
            <button
              class="${classes.join(" ")}"
              onclick="calcPress('${k}')"
            >
              ${k}
            </button>
          `;
        })
        .join("")}

    </div>
  `;
}

function calcPress(k) {

  if (k === "C") {

    window.calcDisplay = "0";
    window.calcPrev = null;
    window.calcOp = null;
    window.calcFresh = false;

  } else if (k === "%") {

    window.calcDisplay =
      String(
        Number(
          window.calcDisplay
        ) / 100
      );

  } else if (
    ["+", "−", "×", "÷"].includes(k)
  ) {

    window.calcPrev =
      Number(
        window.calcDisplay
      );

    window.calcOp = k;
    window.calcFresh = true;

  } else if (k === "=") {

    if (
      window.calcPrev === null ||
      !window.calcOp
    ) {
      return;
    }

    const b =
      Number(
        window.calcDisplay
      );

    let result = 0;

    if (
      window.calcOp === "+"
    ) {
      result =
        window.calcPrev + b;

    } else if (
      window.calcOp === "−"
    ) {
      result =
        window.calcPrev - b;

    } else if (
      window.calcOp === "×"
    ) {
      result =
        window.calcPrev * b;

    } else if (
      window.calcOp === "÷"
    ) {
      result =
        b === 0
          ? 0
          : window.calcPrev / b;
    }

    window.calcDisplay =
      String(
        Number(
          result.toFixed(8)
        )
      );

    window.calcPrev = null;
    window.calcOp = null;

  } else if (k === ".") {

    if (
      !window.calcDisplay.includes(".")
    ) {
      window.calcDisplay += ".";
    }

  } else {

    window.calcDisplay =
      window.calcFresh
        ? k
        : window.calcDisplay === "0"
        ? k
        : window.calcDisplay + k;

    window.calcFresh = false;
  }

  go("calculator");
}

/* =========================================================
   DISTRIBUCIÓN
========================================================= */

function distribution() {

  const last =
    state.sales[0];

  if (!last) {

    return `
      ${header(
        "Distribución",
        "Divide tu dinero"
      )}

      <div class="px">

        <div class="card empty">
          📊

          <br>

          <b>
            Sin ventas aún
          </b>

          <p>
            Registra tu primera venta
            para ver la distribución.
          </p>

        </div>

      </div>
    `;
  }

  const total =
    Number(last.total) || 0;

  const rest =
    Number(last.forRestock) || 0;

  const profit =
    Number(last.profit) || 0;

  return `
    ${header(
      "Distribución",
      "Divide tu dinero"
    )}

    <div class="px">

      <div class="card">

        <div class="stat-label">
          Resumen acumulado
        </div>

        <div
          class="grid2 distribution-summary"
        >

          <div>
            <div class="small muted">
              Ventas
            </div>

            <b>
              ${fmt(stats().totalSales)}
            </b>
          </div>

          <div>
            <div class="small muted">
              Ganancia
            </div>

            <b>
              ${fmt(stats().totalProfit)}
            </b>
          </div>

        </div>

      </div>

      <div class="card">

        <div class="stat-label">
          Última venta
        </div>

        <div class="distribution-total">
          ${fmt(total)}
        </div>

        <div class="row">
          <span>
            Para reponer
          </span>

          <b>
            ${fmt(rest)}
          </b>
        </div>

        <div class="row distribution-row">
          <span>
            Ganancia
          </span>

          <b class="amount-positive">
            ${fmt(profit)}
          </b>
        </div>

        <div
          class="progress"
          style="margin-top:15px"
        >
          <div
            style="
              width:${
                total
                  ? rest / total * 100
                  : 0
              }%
            "
          ></div>
        </div>

      </div>

      <div class="card small muted">
        La app calcula automáticamente
        reposición y ganancia.
      </div>

    </div>
  `;
}

/* =========================================================
   AJUSTES / MÁS
========================================================= */

function settings() {

  return `
    ${header(
      "Más",
      "Configura GummyWare"
    )}

    <div class="px">

      ${installCard()}

      <div class="card">

        <div class="stat-label">
          Configuración financiera
        </div>

        <div class="field settings-field">

          <label>
            Meta de ganancia
          </label>

          <input
            id="set-goal"
            class="input"
            type="number"
            value="${state.settings.profitGoal}"
          >

        </div>

        <div class="field">

          <label>
            Precio por bolsita
          </label>

          <input
            id="set-price"
            class="input"
            type="number"
            value="${state.settings.defaultPrice}"
          >

        </div>

        <div class="field">

          <label>
            Costo por Kg
          </label>

          <input
            id="set-cost"
            class="input"
            type="number"
            value="${state.settings.defaultCostPerKg}"
          >

        </div>

        <div class="field">

          <label>
            Gramos por bolsita
          </label>

          <input
            id="set-grams"
            class="input"
            type="number"
            value="${state.settings.gramsPerBag}"
          >

        </div>

        <div class="checkbox-row">

          <b>
            Cálculo automático
          </b>

          <button
            class="toggle ${
              state.settings.autoCalculation
                ? "on"
                : ""
            }"
            onclick="
              state.settings.autoCalculation =
                !state.settings.autoCalculation;
              save();
              go('settings')
            "
          >
            <i></i>
          </button>

        </div>

        <button
          class="primary full"
          onclick="saveSettings()"
        >
          Guardar cambios
        </button>

      </div>

      <div class="card">

        <div class="stat-label">
          Secciones
        </div>

        <button
          class="menu-option"
          onclick="go('inventory')"
        >
          <span>📦</span>
          <div>
            <b>Inventario</b>
            <small>
              Consulta tu stock
            </small>
          </div>
          <span>›</span>
        </button>

        <button
          class="menu-option"
          onclick="go('distribution')"
        >
          <span>📊</span>
          <div>
            <b>Distribución</b>
            <small>
              Reposición y ganancias
            </small>
          </div>
          <span>›</span>
        </button>

      </div>

      <div class="card">

        <div class="stat-label">
          Datos
        </div>

        <button
          class="secondary full data-button"
          onclick="exportData()"
        >
          Exportar datos
        </button>

        <label
          class="secondary full data-button"
        >
          <input
            type="file"
            accept=".json"
            hidden
            onchange="importData(event)"
          >
          Importar datos
        </label>

      </div>

      <div class="card danger-zone">

        <b>
          Zona de peligro
        </b>

        <p class="small muted">
          Borra todas las ventas,
          compras e inventario.
        </p>

        <button
          class="danger full"
          onclick="resetData()"
        >
          Restablecer datos
        </button>

      </div>

      <div class="app-footer">
        🍬 GummyWare
        <br>
        Compila tu Antojo
        <br>
        v2.0.0
      </div>

    </div>
  `;
}

function saveSettings() {

  state.settings.profitGoal =
    Number(
      document.querySelector(
        "#set-goal"
      ).value
    ) || 0;

  state.settings.defaultPrice =
    Number(
      document.querySelector(
        "#set-price"
      ).value
    ) || 0;

  state.settings.defaultCostPerKg =
    Number(
      document.querySelector(
        "#set-cost"
      ).value
    ) || 0;

  state.settings.gramsPerBag =
    Number(
      document.querySelector(
        "#set-grams"
      ).value
    ) || 0;

  save();

  toast("Ajustes guardados");

  go("settings");
}

function goalModal() {

  modal(`
    <h2>
      ¿Cuánto quieres ganar?
    </h2>

    <div class="field">

      <label>
        Meta de ganancia
      </label>

      <input
        id="goal-modal"
        class="input"
        type="number"
        value="${state.settings.profitGoal}"
      >

    </div>

    <button
      class="primary full"
      onclick="
        state.settings.profitGoal =
          Number(
            document.querySelector(
              '#goal-modal'
            ).value
          ) || 0;

        save();
        closeModal();
        go('home');
      "
    >
      Guardar meta
    </button>
  `);
}

/* =========================================================
   MODALES
========================================================= */

function modal(body) {

  const d =
    document.createElement("div");

  d.id = "modal";
  d.className =
    "modal-backdrop";

  d.innerHTML = `
    <div class="modal-sheet">

      <div class="modal-top">

        <b>
          GummyWare
        </b>

        <button
          class="modal-close"
          onclick="closeModal()"
        >
          ×
        </button>

      </div>

      ${body}

    </div>
  `;

  document.body.appendChild(d);
}

function closeModal() {
  document
    .querySelector("#modal")
    ?.remove();
}

/* =========================================================
   MENSAJES
========================================================= */

function toast(message) {

  const d =
    document.createElement("div");

  d.className = "toast";
  d.textContent = message;

  document.body.appendChild(d);

  setTimeout(
    () => d.remove(),
    2400
  );
}

/* =========================================================
   EXPORTAR / IMPORTAR
========================================================= */

function exportData() {

  const blob =
    new Blob(
      [
        JSON.stringify(
          state,
          null,
          2
        )
      ],
      {
        type: "application/json"
      }
    );

  const a =
    document.createElement("a");

  a.href =
    URL.createObjectURL(blob);

  a.download =
    "gummyware-backup.json";

  a.click();

  URL.revokeObjectURL(
    a.href
  );
}

function importData(event) {

  const file =
    event.target.files[0];

  if (!file) return;

  const reader =
    new FileReader();

  reader.onload = () => {

    try {

      const imported =
        JSON.parse(
          reader.result
        );

      if (
        !imported ||
        typeof imported !==
          "object"
      ) {
        throw new Error();
      }

      state = {
        ...cloneInitial(),
        ...imported,
        settings: {
          ...cloneInitial().settings,
          ...(imported.settings || {})
        }
      };

      save();

      go("settings");

      toast(
        "Datos importados"
      );

    } catch {

      toast(
        "Archivo inválido"
      );
    }
  };

  reader.readAsText(file);
}

function resetData() {

  if (
    confirm(
      "Esta acción no se puede deshacer. ¿Restablecer GummyWare?"
    )
  ) {

    state =
      cloneInitial();

    save();

    go("home");
  }
}

/* =========================================================
   NAVEGACIÓN GLOBAL
========================================================= */

window.go = function(destination) {
  screen = destination;
  render();
};

window.saveSale = saveSale;
window.savePurchase = savePurchase;
window.saveSettings = saveSettings;
window.goalModal = goalModal;
window.closeModal = closeModal;
window.resetData = resetData;
window.exportData = exportData;
window.importData = importData;
window.installApp = installApp;
window.calcPress = calcPress;

/* =========================================================
   RENDER
========================================================= */

function render() {

  let content;

  switch (screen) {

    case "home":
      content = home();
      break;

    case "new-sale":
      content = newSale();
      break;

    case "new-purchase":
      content = purchase();
      break;

    case "inventory":
      content = inventory();
      break;

    case "history":
      content = history();
      break;

    case "calculator":
      content = calculator();
      break;

    case "distribution":
      content = distribution();
      break;

    case "settings":
      content = settings();
      break;

    default:
      content = home();
  }

  shell(content);

  if (
    screen === "new-sale"
  ) {

    const bags =
      document.querySelector(
        "#sale-bags"
      );

    const price =
      document.querySelector(
        "#sale-price"
      );

    if (bags)
      bags.addEventListener(
        "input",
        updateSale
      );

    if (price)
      price.addEventListener(
        "input",
        updateSale
      );

    updateSale();
  }
}

/* =========================================================
   INTRO VIDEO
========================================================= */

function startIntro() {

  const splash =
    document.querySelector(
      "#splash"
    );

  const video =
    document.querySelector(
      "#intro-video"
    );

  const soundButton =
    document.querySelector(
      "#intro-sound"
    );

  const fallback =
    document.querySelector(
      ".splash-fallback"
    );

  if (
    !splash ||
    !video
  ) {
    return;
  }

  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  video.controls = false;
  video.volume = 1;

  const mobile =
    window.matchMedia(
      "(max-width: 699px)"
    ).matches ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(
      navigator.userAgent
    );

  const sources = mobile
    ? [
        "./assets/intro-mobile.mp4",
        "./videos/intro-mobile.mp4",
        "./assets/intro.mp4",
        "./videos/intro.mp4"
      ]
    : [
        "./assets/intro-desktop.mp4",
        "./videos/intro-desktop.mp4",
        "./assets/intro.mp4",
        "./videos/intro.mp4"
      ];

  let sourceIndex = 0;
  let finished = false;

  function finish() {

    if (finished) return;

    finished = true;

    splash.style.transition =
      "opacity .35s ease";

    splash.style.opacity = "0";

    setTimeout(() => {

      splash.remove();

    }, 350);
  }

  function showFallback() {

    if (fallback) {
      fallback.style.display =
        "flex";
    }

    soundButton?.classList.remove(
      "show"
    );

    setTimeout(
      finish,
      1600
    );
  }

  function loadNextSource() {

    if (
      sourceIndex >=
      sources.length
    ) {
      showFallback();
      return;
    }

    video.src =
      sources[sourceIndex];

    sourceIndex++;

    video.load();

    const playAttempt =
      video.play();

    if (
      playAttempt &&
      typeof playAttempt.catch ===
        "function"
    ) {
      playAttempt.catch(() => {
        soundButton?.classList.add(
          "show"
        );
      });
    }
  }

  video.addEventListener(
    "error",
    () => {
      loadNextSource();
    }
  );

  video.addEventListener(
    "ended",
    finish,
    { once: true }
  );

  soundButton?.addEventListener(
    "click",
    async () => {

      try {

        video.muted = false;
        video.volume = 1;

        await video.play();

        soundButton.classList.remove(
          "show"
        );

      } catch {

        video.muted = true;

        soundButton.classList.add(
          "show"
        );
      }
    }
  );

  loadNextSource();

  /*
    Si por algún motivo el video no carga,
    nunca dejamos bloqueada la aplicación.
  */
  setTimeout(() => {

    if (
      !finished &&
      video.readyState === 0
    ) {
      showFallback();
    }

  }, 15000);
}

/* =========================================================
   SERVICE WORKER
========================================================= */

if (
  "serviceWorker" in navigator
) {

  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker
        .register("./sw.js")
        .then(registration => {
          registration.update();
        })
        .catch(() => {});

    }
  );
}

/* =========================================================
   ARRANQUE
========================================================= */

render();
startIntro();

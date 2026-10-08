/* =========================================================
   GUMMYWARE
   Compila tu Antojo
========================================================= */


/* =========================================================
   DATOS INICIALES
========================================================= */

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


/* =========================================================
   ESTADO
========================================================= */

let state = load();

let screen = "home";

const root = document.querySelector("#root");


/* =========================================================
   UTILIDADES
========================================================= */

const fmt = (n) =>
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


/* =========================================================
   CARGAR DATOS
========================================================= */

function load() {

  try {

    const x = localStorage.getItem("gummyware_v1");

    return x
      ? JSON.parse(x)
      : structuredClone(INITIAL);

  } catch {

    return structuredClone(INITIAL);

  }

}


/* =========================================================
   GUARDAR DATOS
========================================================= */

function save() {

  localStorage.setItem(
    "gummyware_v1",
    JSON.stringify(state)
  );

}


/* =========================================================
   ESTADÍSTICAS
========================================================= */

function stats() {

  const sales =
    state.sales.reduce(
      (a, x) => a + Number(x.total || 0),
      0
    );

  const purchases =
    state.purchases.reduce(
      (a, x) => a + Number(x.cost || 0),
      0
    );

  const profit =
    state.sales.reduce(
      (a, x) => a + Number(x.profit || 0),
      0
    );

  return {

    totalSales: sales,

    totalPurchases: purchases,

    totalProfit: profit,

    availableMoney: sales - purchases,

    goalProgress:
      state.settings.profitGoal
        ? Math.min(
            profit / state.settings.profitGoal,
            1
          )
        : 0,

    restockReserve:
      state.sales.reduce(
        (a, x) => a + Number(x.forRestock || 0),
        0
      ) - purchases

  };

}


/* =========================================================
   ICONO MOVIMIENTO
========================================================= */

function moneyIcon(type) {

  return type === "sale"
    ? "↗"
    : "↙";

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
        ⌂
        <span>Inicio</span>
      </button>

      <button
        class="nav-item ${
          screen === "history" ||
          screen === "new-sale"
            ? "active"
            : ""
        }"
        onclick="go('history')"
      >
        ↗
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
        ▣
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
        ☰
        <span>Más</span>
      </button>

    </nav>
  `;

}


/* =========================================================
   SHELL
========================================================= */

function shell(content) {

  root.innerHTML = `
    <div class="app-shell">

      <div class="screen-content">
        ${content}
      </div>

      ${nav()}

    </div>
  `;

}


/* =========================================================
   HEADER
========================================================= */

function header(t, s, back = false) {

  return `
    <header class="header">

      ${
        back
          ? `
            <button
              class="ghost"
              onclick="go('home')"
            >
              ‹ Volver
            </button>
          `
          : ""
      }

      <h1>${t}</h1>

      ${
        s
          ? `<p>${s}</p>`
          : ""
      }

    </header>
  `;

}


/* =========================================================
   INICIO
========================================================= */

function home() {

  const s = stats();

  const reached =
    s.totalProfit >= state.settings.profitGoal &&
    state.settings.profitGoal > 0;

  return `

    ${header(
      "Gummy Ware",
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
              style="
                font-size:28px;
                font-weight:900;
                margin-top:7px
              "
            >
              ${fmt(state.settings.profitGoal)}
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
              <div
                style="
                  margin-top:16px;
                  background:#FFF0F3;
                  border-radius:16px;
                  padding:13px;
                  color:#FF758F;
                  font-weight:900;
                  text-align:center
                "
              >
                ¡Meta alcanzada! 🎊

                <br>

                <span
                  style="
                    font-size:13px;
                    color:var(--text)
                  "
                >
                  Ganancia:
                  ${fmt(s.totalProfit)}
                </span>

              </div>
            `
            : `
              <div style="margin-top:16px">

                <div class="progress">

                  <div
                    style="
                      width:${s.goalProgress * 100}%
                    "
                  ></div>

                </div>

                <div
                  class="row small muted"
                  style="margin-top:7px"
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

          <div
            class="small muted"
            style="margin-top:6px"
          >
            ${state.sales.length} ventas
          </div>

        </div>


        <div class="card">

          <div class="stat-label">
            Ganancia neta
          </div>

          <div
            class="stat-value"
            style="
              color:
                ${
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

            <div
              class="section-head"
              style="
                padding-left:0;
                padding-right:0
              "
            >

              <h2>
                Reciente
              </h2>

              <button
                onclick="go('history')"
              >
                Ver todo
              </button>

            </div>


            ${state.transactions
              .slice(0, 5)
              .map(
                (tx) => `

                  <div
                    class="list-item"
                    style="margin:0 -20px"
                  >

                    <div class="list-icon">
                      ${moneyIcon(tx.type)}
                    </div>

                    <div style="flex:1">

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
                      style="
                        color:
                          ${
                            tx.amount >= 0
                              ? "var(--green)"
                              : "var(--red)"
                          }
                      "
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

            <div
              class="card"
              style="text-align:center"
            >

              <div style="font-size:34px">
                🍬
              </div>

              <b>
                ¡Bienvenida a Gummy Ware!
              </b>

              <p class="muted small">
                Registra tu primera venta
                o compra para comenzar.
              </p>

            </div>

          `
      }


      <div style="height:14px"></div>


      <button
        class="primary full"
        onclick="go('new-sale')"
      >
        ＋ Nueva venta
      </button>


      <button
        class="secondary full"
        style="margin-top:10px"
        onclick="go('new-purchase')"
      >
        ＋ Nueva compra
      </button>

    </div>

  `;

}


/* =========================================================
   NUEVA VENTA
========================================================= */

function newSale() {

  const st =
    state.inventory.find(
      x => x.id === "bolsitas"
    );

  const stock =
    st?.quantity || 0;

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
            step="1"
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
            step="0.01"
            inputmode="decimal"
            value="${state.settings.defaultPrice}"
          >

        </div>


        ${
          stock > 0 && stock <= 20
            ? `
              <div class="badge warn">
                ⚠️ Stock bajo (${stock} bolsitas)
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


        <div
          style="
            background:#F8F7F9;
            border-radius:18px;
            padding:18px;
            margin-top:15px
          "
        >

          <div class="stat-label">
            Costo de producto
          </div>

          <div
            id="sale-cost"
            style="
              font-size:20px;
              font-weight:900;
              margin-top:6px
            "
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


        <div style="margin-top:18px">

          <div class="stat-label">
            Resumen
          </div>


          <div
            class="row"
            style="margin-top:9px"
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
            class="row"
            style="margin-top:7px"
          >

            <span>
              Ganancia estimada
            </span>

            <b id="sale-profit">
              ${fmt(
                20 *
                state.settings.defaultPrice -
                20 *
                state.settings.gramsPerBag /
                1000 *
                state.settings.defaultCostPerKg
              )}
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


/* =========================================================
   ACTUALIZAR VENTA
========================================================= */

function updateSale() {

  const bagsInput =
    document.querySelector(
      "#sale-bags"
    );

  const priceInput =
    document.querySelector(
      "#sale-price"
    );

  if (!bagsInput || !priceInput) {
    return;
  }

  const b =
    Number(bagsInput.value) || 0;

  const p =
    Number(priceInput.value) || 0;

  const c =
    b *
    state.settings.gramsPerBag /
    1000 *
    state.settings.defaultCostPerKg;


  const total =
    b * p;

  const profit =
    total - c;


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


  if (totalElement) {
    totalElement.textContent =
      fmt(total);
  }


  if (costElement) {
    costElement.textContent =
      fmt(c);
  }


  if (profitElement) {
    profitElement.textContent =
      fmt(profit);
  }

}


/* =========================================================
   GUARDAR VENTA
========================================================= */

function saveSale() {

  const bagsElement =
    document.querySelector(
      "#sale-bags"
    );

  const priceElement =
    document.querySelector(
      "#sale-price"
    );

  const b =
    Number(bagsElement?.value) || 0;

  const p =
    Number(priceElement?.value) || 0;


  if (b <= 0 || p <= 0) {

    toast(
      "Ingresa la cantidad y el precio"
    );

    return;

  }


  const c =
    b *
    state.settings.gramsPerBag /
    1000 *
    state.settings.defaultCostPerKg;


  const total =
    b * p;

  const profit =
    total - c;


  const sale = {

    id: uid(),

    date:
      new Date().toISOString(),

    bagsCount: b,

    pricePerBag: p,

    total,

    costUsed: c,

    profit,

    forRestock: c,

    isAutoCalc: true

  };


  state.sales.unshift(sale);


  const inv =
    state.inventory.find(
      x => x.id === "bolsitas"
    );


  if (inv) {

    inv.quantity =
      Math.max(
        0,
        inv.quantity - b
      );

  }


  state.transactions.unshift({

    id: uid(),

    date: sale.date,

    type: "sale",

    description:
      `Venta de ${b} bolsita${
        b !== 1 ? "s" : ""
      }`,

    amount: total,

    saleId: sale.id

  });


  save();

  toast("Venta registrada");

  go("home");

}


/* =========================================================
   NUEVA COMPRA
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
              min="0"
              step="0.01"
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
            min="0"
            step="0.01"
            inputmode="decimal"
            placeholder="$0"
          >

        </div>


        <div
          style="
            background:#FFF0F3;
            border-radius:16px;
            padding:13px;
            font-size:12px;
            color:var(--muted)
          "
        >
          Esta compra se registra como inventario
          del negocio, no como pérdida.
          El gasto se refleja en tu dinero disponible.
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


/* =========================================================
   GUARDAR COMPRA
========================================================= */

function savePurchase() {

  const product =
    document.querySelector(
      "#p-product"
    )?.value;

  const q =
    Number(
      document.querySelector(
        "#p-qty"
      )?.value
    ) || 0;

  const unit =
    document.querySelector(
      "#p-unit"
    )?.value;

  const cost =
    Number(
      document.querySelector(
        "#p-cost"
      )?.value
    ) || 0;


  if (
    q <= 0 ||
    cost <= 0
  ) {

    toast(
      "Completa todos los campos"
    );

    return;

  }


  const p = {

    id: uid(),

    date:
      new Date().toISOString(),

    product,

    quantity: q,

    unit,

    cost

  };


  state.purchases.unshift(p);


  const item =
    state.inventory.find(
      x =>
        x.name.toLowerCase() ===
        product.toLowerCase()
    );


  if (item) {

    const val =
      item.quantity *
      item.avgCost +
      cost;

    const itemq =
      item.quantity + q;

    item.avgCost =
      itemq
        ? val / itemq
        : 0;

    item.quantity =
      itemq;

  }


  state.transactions.unshift({

    id: uid(),

    date: p.date,

    type: "purchase",

    description:
      `Compra de ${q} ${unit} de ${product}`,

    amount: -cost,

    purchaseId: p.id

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
        i.quantity <= i.lowThreshold
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
            <div
              class="card"
              style="
                background:#FEF3C7;
                color:#92400E
              "
            >

              <b>
                Stock bajo
              </b>

              <div
                class="small"
                style="margin-top:4px"
              >
                ${low
                  .map(i => i.name)
                  .join(", ")}

                ${
                  low.length === 1
                    ? "necesita"
                    : "necesitan"
                }

                reposición.
              </div>

            </div>
          `
          : ""
      }


      <div
        class="card"
        style="
          padding:0;
          overflow:hidden
        "
      >

        ${state.inventory
          .map(
            i => `

              <div class="list-item">

                <div class="list-icon">

                  ${
                    i.name === "Bolsitas"
                      ? "▣"
                      : "🍬"
                  }

                </div>


                <div style="flex:1">

                  <b>
                    ${i.name}
                  </b>

                  <div class="small muted">

                    Costo prom:
                    ${fmt(i.avgCost)}
                    /${i.unit}

                  </div>

                </div>


                <div
                  style="text-align:right"
                >

                  <b>
                    ${qty(
                      i.quantity,
                      i.unit
                    )}
                  </b>

                  <br>

                  <span
                    class="
                      badge
                      ${
                        i.quantity === 0
                          ? "danger"
                          : i.quantity <= i.lowThreshold
                          ? "warn"
                          : "success"
                      }
                    "
                  >

                    ${
                      i.quantity === 0
                        ? "Agotado"
                        : i.quantity <= i.lowThreshold
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
        style="margin-top:14px"
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
            ${state.sales.length} ventas
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
            ${state.purchases.length} compras
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
      class="card"
      style="
        padding:0;
        overflow:hidden
      "
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


                    <div style="flex:1">

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
                      style="
                        color:
                          ${
                            tx.amount >= 0
                              ? "var(--green)"
                              : "var(--red)"
                          }
                      "
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

function calculator() {

  return `

    ${header(
      "Calculadora",
      "Estima tus ganancias"
    )}

    <div class="px">

      <div class="card">

        <div
          class="row"
          style="
            background:#F0EFF2;
            padding:4px;
            border-radius:14px;
            margin-bottom:15px
          "
        >

          <button
            class="secondary full"
            id="biz-tab"
            onclick="
              calcMode='business';
              go('calculator')
            "
          >
            Negocio
          </button>


          <button
            class="ghost full"
            onclick="
              calcMode='basic';
              go('calculator')
            "
          >
            Calculadora
          </button>

        </div>


        ${
          window.calcMode !== "basic"
            ? businessCalc()
            : basicCalc()
        }

      </div>

    </div>

  `;

}


/* =========================================================
   CALCULADORA DE NEGOCIO
========================================================= */

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
      : Number(c);


  const total =
    b * p;


  const profit =
    total -
    cost -
    e;


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
      ? Math.ceil(remain / per)
      : 0;


  const days =
    b
      ? Math.ceil(need / b)
      : 0;


  return `

    <div class="stat-label">
      Simulación de venta
    </div>


    <div
      class="field"
      style="margin-top:14px"
    >

      <label>
        Bolsitas a vender
      </label>

      <input
        class="input"
        type="number"
        value="${b}"
        oninput="
          calcB=+this.value;
          refreshBusinessCalc(this)
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
          calcP=+this.value;
          refreshBusinessCalc(this)
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
          calcC=this.value;
          refreshBusinessCalc(this)
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
          calcE=+this.value;
          refreshBusinessCalc(this)
        "
      >

    </div>


    <div
      style="
        background:#FFF8F9;
        border-radius:18px;
        padding:18px
      "
    >

      <div class="row">

        <span>
          Venta total
        </span>

        <b>
          ${fmt(total)}
        </b>

      </div>


      <div
        class="row"
        style="margin-top:10px"
      >

        <span>
          Costo total
        </span>

        <b style="color:var(--red)">
          −${fmt(cost + e)}
        </b>

      </div>


      <hr
        style="
          border:0;
          border-top:
            1px solid var(--border);
          margin:14px 0
        "
      >


      <div class="row">

        <b>
          Ganancia estimada
        </b>

        <b
          style="
            font-size:23px;
            color:
              ${
                profit >= 0
                  ? "var(--green)"
                  : "var(--red)"
              }
          "
        >
          ${fmt(profit)}
        </b>

      </div>


      <div
        class="small muted"
        style="
          text-align:right;
          margin-top:6px
        "
      >
        ${fmt(per)} por bolsita
      </div>

    </div>


    ${
      remain > 0 && per > 0
        ? `

          <div
            class="card"
            style="
              margin-top:14px;
              background:#FFF0F3
            "
          >

            <b>
              ¿Cuánto necesito vender?
            </b>

            <p
              style="
                color:var(--pink);
                font-weight:800
              "
            >
              Necesitas vender aproximadamente
              <strong>${b}</strong>
              bolsitas al día durante
              <strong>${days}</strong>
              días.
            </p>


            <div class="grid2">

              <div class="badge neutral">

                Meta restante

                <br>

                ${fmt(remain)}

              </div>


              <div class="badge neutral">

                Bolsitas necesarias

                <br>

                ${need}

              </div>

            </div>

          </div>

        `
        : ""
    }

  `;

}


/* =========================================================
   ACTUALIZAR SOLO CALCULADORA
========================================================= */

function refreshBusinessCalc(input) {

  /*
     Evita reconstruir toda la pantalla mientras
     el usuario está escribiendo.

     Esto también evita que el cursor se mueva
     o que el teclado del teléfono desaparezca.
  */

  const card =
    input?.closest(".card");

  if (!card) {
    return;
  }

  /*
     La calculadora se actualiza al perder el foco.
     Mientras escribe, conserva el campo.
  */

}


/* =========================================================
   CALCULADORA BÁSICA
========================================================= */

function basicCalc() {

  return `

    <div class="calc-display">

      <div class="value">
        ${window.calcDisplay || "0"}
      </div>

    </div>


    <div class="keys">

      ${[
        "C",
        "%",
        "÷",
        "7",
        "8",
        "9",
        "×",
        "4",
        "5",
        "6",
        "−",
        "1",
        "2",
        "3",
        "+",
        "0",
        ".",
        "="
      ]
        .map(
          k => `

            <button
              class="
                key
                ${
                  [
                    "÷",
                    "×",
                    "−",
                    "+"
                  ].includes(k)
                    ? "op"
                    : ""
                }

                ${
                  [
                    "C",
                    "%"
                  ].includes(k)
                    ? "special"
                    : ""
                }

                ${
                  k === "="
                    ? "equal"
                    : ""
                }
              "
              onclick="
                calcPress('${k}')
              "
            >
              ${k}
            </button>

          `
        )
        .join("")}

    </div>

  `;

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
    last.total;

  const rest =
    last.forRestock;

  const profit =
    last.profit;


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
          class="grid2"
          style="margin-top:14px"
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


        <div
          style="
            font-size:28px;
            font-weight:900;
            margin:8px 0
          "
        >
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


        <div
          class="row"
          style="margin-top:9px"
        >

          <span>
            Ganancia
          </span>

          <b style="color:var(--green)">
            ${fmt(profit)}
          </b>

        </div>


        <div
          class="progress"
          style="margin-top:15px"
        >

          <div
            style="
              width:
                ${
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
   AJUSTES
========================================================= */

function settings() {

  return `

    ${header(
      "Ajustes",
      "Configura tu negocio"
    )}

    <div class="px">


      <div class="card">

        <div class="stat-label">
          Configuración financiera
        </div>


        <div
          class="field"
          style="margin-top:14px"
        >

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
            class="
              toggle
              ${
                state.settings.autoCalculation
                  ? "on"
                  : ""
              }
            "
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
          Datos
        </div>


        <button
          class="secondary full"
          style="margin-top:12px"
          onclick="exportData()"
        >
          Exportar datos
        </button>


        <label
          class="secondary full"
          style="margin-top:10px"
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


      <div
        style="
          text-align:center;
          padding:15px;
          color:var(--muted);
          font-size:12px
        "
      >

        🍬 Gummy Ware

        <br>

        Compila tu Antojo

        <br>

        v1.1.0 • Datos guardados localmente

      </div>

    </div>

  `;

}


/* =========================================================
   GUARDAR AJUSTES
========================================================= */

function saveSettings() {

  state.settings.profitGoal =
    Number(
      document.querySelector(
        "#set-goal"
      )?.value
    ) || 0;


  state.settings.defaultPrice =
    Number(
      document.querySelector(
        "#set-price"
      )?.value
    ) || 0;


  state.settings.defaultCostPerKg =
    Number(
      document.querySelector(
        "#set-cost"
      )?.value
    ) || 0;


  state.settings.gramsPerBag =
    Number(
      document.querySelector(
        "#set-grams"
      )?.value
    ) || 0;


  save();

  toast("Ajustes guardados");

  go("settings");

}


/* =========================================================
   MODAL META
========================================================= */

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

        go('home')
      "
    >
      Guardar meta
    </button>

  `);

}


/* =========================================================
   MODAL
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


/* =========================================================
   CERRAR MODAL
========================================================= */

function closeModal() {

  document
    .querySelector("#modal")
    ?.remove();

}


/* =========================================================
   TOAST
========================================================= */

function toast(msg) {

  const d =
    document.createElement("div");

  d.className =
    "toast";

  d.textContent =
    msg;


  document.body.appendChild(d);


  setTimeout(
    () => d.remove(),
    2400
  );

}


/* =========================================================
   EXPORTAR
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
        type:
          "application/json"
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


/* =========================================================
   IMPORTAR
========================================================= */

function importData(e) {

  const f =
    e.target.files[0];


  if (!f) {
    return;
  }


  const r =
    new FileReader();


  r.onload = () => {

    try {

      state =
        JSON.parse(
          r.result
        );


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


  r.readAsText(f);

}


/* =========================================================
   RESTABLECER
========================================================= */

function resetData() {

  if (
    confirm(
      "Esta acción no se puede deshacer. ¿Restablecer GummyWare?"
    )
  ) {

    state =
      structuredClone(
        INITIAL
      );

    save();

    go("home");

  }

}


/* =========================================================
   EXPONER FUNCIONES
========================================================= */

window.go =
  function (s) {

    screen = s;

    render();

  };


window.saveSale =
  saveSale;

window.savePurchase =
  savePurchase;

window.saveSettings =
  saveSettings;

window.goalModal =
  goalModal;

window.closeModal =
  closeModal;

window.resetData =
  resetData;

window.exportData =
  exportData;

window.importData =
  importData;


/* =========================================================
   VARIABLES CALCULADORA
========================================================= */

window.calcMode =
  "business";

window.calcDisplay =
  "0";

window.calcPrev =
  null;

window.calcOp =
  null;

window.calcFresh =
  false;

window.calcB =
  35;

window.calcP =
  state.settings.defaultPrice;

window.calcC =
  "";

window.calcE =
  0;


/* =========================================================
   CALCULADORA BÁSICA
========================================================= */

function calcPress(k) {

  if (k === "C") {

    window.calcDisplay =
      "0";

    window.calcPrev =
      null;

    window.calcOp =
      null;

    window.calcFresh =
      false;

  }


  else if (k === "%") {

    window.calcDisplay =
      String(
        Number(
          window.calcDisplay
        ) / 100
      );

  }


  else if (
    [
      "+",
      "−",
      "×",
      "÷"
    ].includes(k)
  ) {

    window.calcPrev =
      Number(
        window.calcDisplay
      );

    window.calcOp =
      k;

    window.calcFresh =
      true;

  }


  else if (k === "=") {

    if (
      window.calcPrev == null ||
      !window.calcOp
    ) {

      return;

    }


    const b =
      Number(
        window.calcDisplay
      );


    let r;


    if (
      window.calcOp === "+"
    ) {

      r =
        window.calcPrev + b;

    }


    else if (
      window.calcOp === "−"
    ) {

      r =
        window.calcPrev - b;

    }


    else if (
      window.calcOp === "×"
    ) {

      r =
        window.calcPrev * b;

    }


    else {

      r =
        b
          ? window.calcPrev / b
          : 0;

    }


    window.calcDisplay =
      String(
        Number(
          r.toFixed(8)
        )
      );


    window.calcPrev =
      null;

    window.calcOp =
      null;

  }


  else if (k === ".") {

    if (
      !window.calcDisplay.includes(".")
    ) {

      window.calcDisplay += ".";

    }

  }


  else {

    window.calcDisplay =
      window.calcFresh
        ? k
        : window.calcDisplay === "0"
        ? k
        : window.calcDisplay + k;

    window.calcFresh =
      false;

  }


  go("calculator");

}


window.calcPress =
  calcPress;


/* =========================================================
   RENDER
========================================================= */

function render() {

  let c;


  if (screen === "home") {

    c = home();

  }

  else if (
    screen === "new-sale"
  ) {

    c = newSale();

  }

  else if (
    screen === "new-purchase"
  ) {

    c = purchase();

  }

  else if (
    screen === "inventory"
  ) {

    c = inventory();

  }

  else if (
    screen === "history"
  ) {

    c = history();

  }

  else if (
    screen === "calculator"
  ) {

    c = calculator();

  }

  else if (
    screen === "distribution"
  ) {

    c = distribution();

  }

  else {

    c = settings();

  }


  shell(c);


  /*
     Eventos de Nueva Venta
  */

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


    if (bags) {

      bags.addEventListener(
        "input",
        updateSale
      );

    }


    if (price) {

      price.addEventListener(
        "input",
        updateSale
      );

    }


    updateSale();

  }

}


/* =========================================================
   INICIAR APLICACIÓN
========================================================= */

render();


/* =========================================================
   PWA - DETECTAR DISPOSITIVO
========================================================= */

function isMobileDevice() {

  return (

    window.matchMedia(
      "(max-width:699px)"
    ).matches

    ||

    /Android|iPhone|iPad|iPod|Mobile/i.test(
      navigator.userAgent
    )

  );

}


/* =========================================================
   PWA - INTRO
========================================================= */

function startIntro() {

  const video =
    document.querySelector(
      "#intro-video"
    );

  const soundButton =
    document.querySelector(
      "#intro-sound"
    );

  const splash =
    document.querySelector(
      "#splash"
    );


  if (
    !video ||
    !splash
  ) {

    return;

  }


  /*
     IMPORTANTE:

     Estos archivos deben existir exactamente:

     assets/intro-mobile.mp4
     assets/intro-desktop.mp4
  */

  const mobile =
    isMobileDevice();


  const videoPath =
    mobile
      ? "./assets/intro-mobile.mp4"
      : "./assets/intro-desktop.mp4";


  video.src =
    videoPath;


  video.muted =
    false;

  video.volume =
    1;


  let finished =
    false;


  /* ==========================================
     FINALIZAR INTRO
  ========================================== */

  function finishIntro() {

    if (finished) {
      return;
    }


    finished =
      true;


    splash.style.transition =
      "opacity .35s ease";


    splash.style.opacity =
      "0";


    setTimeout(
      () => {

        splash.remove();

      },
      350
    );

  }


  /* ==========================================
     BOTÓN SONIDO
  ========================================== */

  function showSoundButton() {

    if (
      !soundButton ||
      finished
    ) {

      return;

    }


    soundButton.classList.add(
      "show"
    );

  }


  function hideSoundButton() {

    if (!soundButton) {
      return;
    }


    soundButton.classList.remove(
      "show"
    );

  }


  /* ==========================================
     REPRODUCIR VIDEO
  ========================================== */

  function playVideo() {

    video.muted =
      false;

    video.volume =
      1;


    const promise =
      video.play();


    if (
      promise &&
      typeof promise.catch ===
        "function"
    ) {

      promise
        .then(() => {

          hideSoundButton();

        })

        .catch(() => {

          showSoundButton();

        });

    }

  }


  /* ==========================================
     BOTÓN PARA ACTIVAR SONIDO
  ========================================== */

  if (soundButton) {

    soundButton.addEventListener(
      "click",
      () => {

        video.muted =
          false;

        video.volume =
          1;


        const promise =
          video.play();


        if (
          promise &&
          typeof promise.then ===
            "function"
        ) {

          promise
            .then(() => {

              hideSoundButton();

            })

            .catch(() => {

              showSoundButton();

            });

        }

      }
    );

  }


  /* ==========================================
     VIDEO TERMINADO
  ========================================== */

  video.addEventListener(
    "ended",
    finishIntro,
    {
      once: true
    }
  );


  /* ==========================================
     ERROR DEL VIDEO
  ========================================== */

  video.addEventListener(
    "error",
    () => {

      console.error(
        "No se pudo cargar el video:",
        video.src
      );


      const fallback =
        document.querySelector(
          ".splash-fallback"
        );


      if (fallback) {

        fallback.style.display =
          "flex";

      }


      if (soundButton) {

        soundButton.classList.remove(
          "show"
        );

      }


      setTimeout(
        finishIntro,
        1600
      );

    },
    {
      once: true
    }
  );


  /* ==========================================
     VIDEO CARGADO
  ========================================== */

  video.addEventListener(
    "loadeddata",
    () => {

      playVideo();

    },
    {
      once: true
    }
  );


  /*
     Intento inicial.
  */

  playVideo();

}


/* =========================================================
   PWA - INSTALACIÓN
========================================================= */

let deferredInstallPrompt =
  null;


/* =========================================================
   CREAR BOTÓN DE INSTALACIÓN
========================================================= */

function createInstallButton() {

  /*
     Si ya está instalada como aplicación,
     no mostramos el botón.
  */

  if (
    window.matchMedia(
      "(display-mode: standalone)"
    ).matches
    ||
    window.navigator.standalone === true
  ) {

    return;

  }


  if (
    document.querySelector(
      "#install-app"
    )
  ) {

    return;

  }


  const button =
    document.createElement(
      "button"
    );


  button.id =
    "install-app";


  button.className =
    "install-app-button";


  button.type =
    "button";


  button.innerHTML =
    "📲 <span>Instalar GummyWare</span>";


  button.addEventListener(
    "click",
    installGummyWare
  );


  document.body.appendChild(
    button
  );

}


/* =========================================================
   MOSTRAR BOTÓN INSTALAR
========================================================= */

function showInstallButton() {

  createInstallButton();


  const button =
    document.querySelector(
      "#install-app"
    );


  if (button) {

    button.style.display =
      "flex";

  }

}


/* =========================================================
   OCULTAR BOTÓN
========================================================= */

function hideInstallButton() {

  const button =
    document.querySelector(
      "#install-app"
    );


  if (button) {

    button.remove();

  }

}


/* =========================================================
   CHROME / EDGE
========================================================= */

window.addEventListener(
  "beforeinstallprompt",
  event => {

    /*
       Evita el aviso automático.
    */

    event.preventDefault();


    deferredInstallPrompt =
      event;


    /*
       Ahora nuestro botón
       sí puede abrir el instalador.
    */

    showInstallButton();

  }
);


/* =========================================================
   INSTALAR GUMMYWARE
========================================================= */

async function installGummyWare() {

  /*
     Chrome / Edge / Android
  */

  if (
    deferredInstallPrompt
  ) {

    deferredInstallPrompt.prompt();


    try {

      const result =
        await deferredInstallPrompt.userChoice;


      if (
        result.outcome ===
        "accepted"
      ) {

        deferredInstallPrompt =
          null;

        hideInstallButton();

      }

    } catch (error) {

      console.error(
        "Error al instalar:",
        error
      );

    }


    return;

  }


  /*
     iPhone / iPad
  */

  const ios =
    /iPhone|iPad|iPod/i.test(
      navigator.userAgent
    );


  if (ios) {

    showIOSInstallInstructions();

    return;

  }


  /*
     Otros navegadores.
  */

  alert(
    "Para instalar GummyWare:\n\n" +
    "Abre el menú de tu navegador y selecciona " +
    "\"Instalar aplicación\" o " +
    "\"Agregar a pantalla de inicio\"."
  );

}


/* =========================================================
   INSTRUCCIONES IOS
========================================================= */

function showIOSInstallInstructions() {

  let modal =
    document.querySelector(
      "#ios-install-modal"
    );


  if (modal) {

    modal.classList.add(
      "show"
    );

    return;

  }


  modal =
    document.createElement(
      "div"
    );


  modal.id =
    "ios-install-modal";


  modal.className =
    "ios-install-modal";


  modal.innerHTML = `

    <div class="ios-install-box">

      <button
        class="ios-close"
        type="button"
        aria-label="Cerrar"
      >
        ×
      </button>


      <div class="ios-install-icon">
        📲
      </div>


      <h2>
        Instalar GummyWare
      </h2>


      <p>
        Para instalar GummyWare
        en tu iPhone o iPad:
      </p>


      <ol>

        <li>
          Pulsa el botón
          <strong>Compartir</strong>
          de Safari.
        </li>


        <li>
          Selecciona
          <strong>
            Agregar a pantalla de inicio
          </strong>.
        </li>


        <li>
          Pulsa
          <strong>Agregar</strong>.
        </li>

      </ol>


      <button
        class="ios-ok"
        type="button"
      >
        Entendido
      </button>

    </div>

  `;


  document.body.appendChild(
    modal
  );


  modal
    .querySelector(
      ".ios-close"
    )
    .addEventListener(
      "click",
      () => {

        modal.classList.remove(
          "show"
        );

      }
    );


  modal
    .querySelector(
      ".ios-ok"
    )
    .addEventListener(
      "click",
      () => {

        modal.classList.remove(
          "show"
        );

      }
    );


  setTimeout(
    () => {

      modal.classList.add(
        "show"
      );

    },
    10
  );

}


/* =========================================================
   APP YA INSTALADA
========================================================= */

window.addEventListener(
  "appinstalled",
  () => {

    deferredInstallPrompt =
      null;

    hideInstallButton();

  }
);


/* =========================================================
   MOSTRAR BOTÓN EN DISPOSITIVOS
========================================================= */

function prepareInstallButton() {

  /*
     Si ya está instalada,
     no hacemos nada.
  */

  if (
    window.matchMedia(
      "(display-mode: standalone)"
    ).matches
    ||
    window.navigator.standalone === true
  ) {

    return;

  }


  /*
     Creamos el botón.

     En Android/Chrome,
     posteriormente beforeinstallprompt
     permitirá instalar directamente.

     En iPhone,
     abre instrucciones.
  */

  showInstallButton();

}


/* =========================================================
   SERVICE WORKER
========================================================= */

if (
  "serviceWorker" in navigator
) {

  window.addEventListener(
    "load",
    async () => {

      try {

        const registration =
          await navigator.serviceWorker.register(
            "./sw.js"
          );


        /*
           Buscar inmediatamente
           una nueva versión.
        */

        await registration.update();


        console.log(
          "GummyWare Service Worker activo"
        );

      } catch (error) {

        console.error(
          "Error Service Worker:",
          error
        );

      }

    }
  );

}


/* =========================================================
   INICIAR PWA
========================================================= */

startIntro();


/*
   Esperamos un momento para no
   interferir con la carga inicial.
*/

setTimeout(
  prepareInstallButton,
  1200
);

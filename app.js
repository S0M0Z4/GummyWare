const INITIAL = {
  settings: {
    profitGoal: 1450,
    defaultPrice: 15,
    defaultCostPerKg: 95,
    gramsPerBag: 60,
    autoCalculation: true
  },

  inventory: [
    {id:"bolsitas",name:"Bolsitas",quantity:0,unit:"unidades",avgCost:0,lowThreshold:20},
    {id:"gomitas",name:"Gomitas",quantity:0,unit:"kg",avgCost:0,lowThreshold:.5},
    {id:"gusanos",name:"Gusanos",quantity:0,unit:"kg",avgCost:0,lowThreshold:.5},
    {id:"panditas",name:"Panditas",quantity:0,unit:"kg",avgCost:0,lowThreshold:.5},
    {id:"chamoy",name:"Chamoy",quantity:0,unit:"ml",avgCost:0,lowThreshold:100},
    {id:"miguelito",name:"Miguelito",quantity:0,unit:"g",avgCost:0,lowThreshold:50}
  ],

  sales: [],
  purchases: [],
  transactions: []
};

let state = load();
let screen = "home";

const root = document.querySelector("#root");

const fmt = n =>
  "$" + (Number(n) || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });

const qty = (n,u) =>
  `${Number(n)%1===0 ? Number(n) : Number(n).toFixed(2)} ${u}`;

const uid = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2);

function load(){
  try{
    const x = localStorage.getItem("gummyware_v1");
    return x ? JSON.parse(x) : structuredClone(INITIAL);
  }catch{
    return structuredClone(INITIAL);
  }
}

function save(){
  localStorage.setItem("gummyware_v1", JSON.stringify(state));
}

function stats(){
  const sales = state.sales.reduce((a,x)=>a + Number(x.total || 0),0);
  const purchases = state.purchases.reduce((a,x)=>a + Number(x.cost || 0),0);
  const profit = state.sales.reduce((a,x)=>a + Number(x.profit || 0),0);

  return {
    totalSales:sales,
    totalPurchases:purchases,
    totalProfit:profit,
    availableMoney:sales-purchases,
    goalProgress:state.settings.profitGoal
      ? Math.min(profit/state.settings.profitGoal,1)
      : 0,
    restockReserve:
      state.sales.reduce((a,x)=>a + Number(x.forRestock || 0),0)-purchases
  };
}

function moneyIcon(type){
  return type === "sale" ? "↗" : "↙";
}


/* =========================
   NAVEGACIÓN
========================= */

function nav(){

  return `
  <nav class="bottom-nav">

    <button class="nav-item ${screen==="home"?"active":""}"
      onclick="go('home')">
      <span class="nav-symbol">⌂</span>
      <span>Inicio</span>
    </button>

    <button class="nav-item ${screen==="history"||screen==="new-sale"?"active":""}"
      onclick="go('history')">
      <span class="nav-symbol">↗</span>
      <span>Ventas</span>
    </button>

    <div class="fab-wrap">
      <button class="fab" onclick="go('new-sale')">＋</button>
    </div>

    <button class="nav-item ${screen==="calculator"?"active":""}"
      onclick="go('calculator')">
      <span class="nav-symbol">▣</span>
      <span>Calc</span>
    </button>

    <button class="nav-item ${["settings","distribution","inventory","new-purchase"].includes(screen)?"active":""}"
      onclick="go('settings')">
      <span class="nav-symbol">☰</span>
      <span>Más</span>
    </button>

  </nav>`;
}

function shell(content){

  root.innerHTML = `
    <div class="app-shell">

      <main class="screen-content">
        ${content}
      </main>

      ${nav()}

    </div>
  `;
}

function header(t,s,back=false){

  return `
    <header class="header">

      ${back
        ? `<button class="ghost back-button" onclick="go('home')">‹ Volver</button>`
        : ""}

      <h1>${t}</h1>

      ${s ? `<p>${s}</p>` : ""}

    </header>
  `;
}


/* =========================
   INICIO
========================= */

function home(){

  const s = stats();

  const reached =
    s.totalProfit >= state.settings.profitGoal &&
    state.settings.profitGoal > 0;

  return `

  ${header("Gummy Ware","Tu antojo, bajo control.")}

  <div class="px">

    <div class="card">

      <div class="row">

        <div>
          <div class="stat-label">Meta de ganancia</div>

          <div class="stat-big">
            ${fmt(state.settings.profitGoal)}
          </div>
        </div>

        <button class="secondary" onclick="goalModal()">
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
              Ganancia: ${fmt(s.totalProfit)}
            </span>
          </div>
        `

        : `
          <div class="goal-area">

            <div class="progress">
              <div style="width:${s.goalProgress*100}%"></div>
            </div>

            <div class="row small muted">
              <span>Ganancia actual</span>
              <b>${fmt(s.totalProfit)}</b>
            </div>

          </div>
        `
      }

    </div>


    <div class="grid2">

      <div class="card">

        <div class="stat-label">Ventas</div>

        <div class="stat-value">
          ${fmt(s.totalSales)}
        </div>

        <div class="small muted">
          ${state.sales.length} ventas
        </div>

      </div>


      <div class="card">

        <div class="stat-label">Ganancia neta</div>

        <div
          class="stat-value"
          style="color:${s.totalProfit<0?"var(--red)":"var(--green)"}"
        >
          ${fmt(s.totalProfit)}
        </div>

      </div>

    </div>


    <div class="card">

      <div class="stat-label">Disponible</div>

      <div class="stat-value">
        ${fmt(s.availableMoney)}
      </div>

    </div>


    ${
      state.transactions.length

      ? `

        <div class="section-head">
          <h2>Reciente</h2>

          <button onclick="go('history')">
            Ver todo
          </button>
        </div>

        ${state.transactions.slice(0,5).map(tx=>`

          <div class="list-item recent-item">

            <div class="list-icon">
              ${moneyIcon(tx.type)}
            </div>

            <div class="transaction-info">

              <b>${tx.description}</b>

              <div class="small muted">
                ${new Date(tx.date).toLocaleDateString("es-MX",{
                  day:"numeric",
                  month:"short"
                })}
              </div>

            </div>

            <b
              style="color:${tx.amount>=0?"var(--green)":"var(--red)"}"
            >
              ${tx.amount>=0?"+":""}${fmt(tx.amount)}
            </b>

          </div>

        `).join("")}

      `

      : `

        <div class="card welcome-card">

          <div class="welcome-icon">🍬</div>

          <b>¡Bienvenida a Gummy Ware!</b>

          <p class="muted small">
            Registra tu primera venta o compra para comenzar.
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


/* =========================
   NUEVA VENTA
========================= */

function newSale(){

  const st =
    state.inventory.find(x=>x.id==="bolsitas");

  const stock = st?.quantity || 0;

  return `

  ${header("Nueva venta","Registra una venta",true)}

  <div class="px">

    <div class="card">

      <div class="field">

        <label>Bolsitas</label>

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

        <label>Precio por bolsita</label>

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
        stock>0 && stock<=20

        ? `
          <div class="badge warn">
            ⚠️ Stock bajo (${stock} bolsitas)
          </div>
        `

        : stock===0

        ? `
          <div class="badge danger">
            Sin bolsitas en inventario
          </div>
        `

        : ""
      }


      <div class="sale-cost-box">

        <div class="stat-label">
          Costo de producto
        </div>

        <div id="sale-cost" class="sale-cost">
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

        <div class="row summary-row">
          <span>Venta total</span>
          <b id="sale-total">
            ${fmt(20*state.settings.defaultPrice)}
          </b>
        </div>

        <div class="row summary-row">
          <span>Ganancia estimada</span>
          <b id="sale-profit"></b>
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

function updateSale(){

  const bagsEl = document.querySelector("#sale-bags");
  const priceEl = document.querySelector("#sale-price");

  if(!bagsEl || !priceEl) return;

  const b = +bagsEl.value || 0;
  const p = +priceEl.value || 0;

  const c =
    b *
    state.settings.gramsPerBag /
    1000 *
    state.settings.defaultCostPerKg;

  const total = b*p;
  const profit = total-c;

  const totalEl = document.querySelector("#sale-total");
  const costEl = document.querySelector("#sale-cost");
  const profitEl = document.querySelector("#sale-profit");

  if(totalEl) totalEl.textContent = fmt(total);
  if(costEl) costEl.textContent = fmt(c);
  if(profitEl) profitEl.textContent = fmt(profit);
}

function saveSale(){

  const b =
    +document.querySelector("#sale-bags").value || 0;

  const p =
    +document.querySelector("#sale-price").value || 0;

  if(b<=0 || p<=0){
    return toast("Ingresa la cantidad y el precio");
  }

  const c =
    b *
    state.settings.gramsPerBag /
    1000 *
    state.settings.defaultCostPerKg;

  const total = b*p;
  const profit = total-c;

  const sale = {
    id:uid(),
    date:new Date().toISOString(),
    bagsCount:b,
    pricePerBag:p,
    total,
    costUsed:c,
    profit,
    forRestock:c,
    isAutoCalc:true
  };

  state.sales.unshift(sale);

  const inv =
    state.inventory.find(x=>x.id==="bolsitas");

  if(inv){
    inv.quantity =
      Math.max(0,inv.quantity-b);
  }

  state.transactions.unshift({
    id:uid(),
    date:sale.date,
    type:"sale",
    description:
      `Venta de ${b} bolsita${b!==1?"s":""}`,
    amount:total,
    saleId:sale.id
  });

  save();

  toast("Venta registrada");

  go("home");
}


/* =========================
   COMPRAS
========================= */

function purchase(){

  return `

  ${header("Nueva compra","Registra una compra",true)}

  <div class="px">

    <div class="card">

      <div class="field">

        <label>Producto</label>

        <select id="p-product" class="input">

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

          <label>Cantidad</label>

          <input
            id="p-qty"
            class="input"
            type="number"
            min="0"
            value="1"
          >

        </div>


        <div class="field">

          <label>Unidad</label>

          <select id="p-unit" class="input">

            <option>kg</option>
            <option>unidades</option>
            <option>g</option>
            <option>ml</option>
            <option>paquetes</option>

          </select>

        </div>

      </div>


      <div class="field">

        <label>Costo total</label>

        <input
          id="p-cost"
          class="input"
          type="number"
          inputmode="decimal"
          placeholder="$0"
        >

      </div>


      <div class="info-box">
        Esta compra se registra como inventario del negocio,
        no como pérdida. El gasto se refleja en tu dinero disponible.
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

function savePurchase(){

  const product =
    document.querySelector("#p-product").value;

  const q =
    +document.querySelector("#p-qty").value || 0;

  const unit =
    document.querySelector("#p-unit").value;

  const cost =
    +document.querySelector("#p-cost").value || 0;

  if(q<=0 || cost<=0){
    return toast("Completa todos los campos");
  }

  const p = {
    id:uid(),
    date:new Date().toISOString(),
    product,
    quantity:q,
    unit,
    cost
  };

  state.purchases.unshift(p);

  const item =
    state.inventory.find(
      x=>x.name.toLowerCase()===product.toLowerCase()
    );

  if(item){

    const val =
      item.quantity*item.avgCost+cost;

    const itemq =
      item.quantity+q;

    item.avgCost =
      itemq ? val/itemq : 0;

    item.quantity = itemq;
  }

  state.transactions.unshift({
    id:uid(),
    date:p.date,
    type:"purchase",
    description:
      `Compra de ${q} ${unit} de ${product}`,
    amount:-cost,
    purchaseId:p.id
  });

  save();

  toast("Compra registrada");

  go("inventory");
}


/* =========================
   INVENTARIO
========================= */

function inventory(){

  const low =
    state.inventory.filter(
      i=>i.quantity>0 &&
      i.quantity<=i.lowThreshold
    );

  return `

  ${header("Inventario","Tu stock actual")}

  <div class="px">

    ${
      low.length

      ? `
        <div class="card stock-warning">

          <b>Stock bajo</b>

          <div class="small">
            ${low.map(i=>i.name).join(", ")}
            ${low.length===1?"necesita":"necesitan"}
            reposición.
          </div>

        </div>
      `

      : ""
    }


    <div class="card inventory-card">

      ${state.inventory.map(i=>`

        <div class="list-item">

          <div class="list-icon">
            ${i.name==="Bolsitas"?"▣":"🍬"}
          </div>

          <div class="transaction-info">

            <b>${i.name}</b>

            <div class="small muted">
              Costo prom:
              ${fmt(i.avgCost)}/${i.unit}
            </div>

          </div>

          <div class="inventory-right">

            <b>${qty(i.quantity,i.unit)}</b>

            <br>

            <span class="badge ${
              i.quantity===0
                ?"danger"
                :i.quantity<=i.lowThreshold
                ?"warn"
                :"success"
            }">

              ${
                i.quantity===0
                  ?"Agotado"
                  :i.quantity<=i.lowThreshold
                  ?"Stock bajo"
                  :"Disponible"
              }

            </span>

          </div>

        </div>

      `).join("")}

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


/* =========================
   HISTORIAL
========================= */

function history(){

  const s = stats();

  return `

  ${header("Historial","Todos tus movimientos")}

  <div class="px">

    <div class="grid2">

      <div class="card">
        <div class="stat-label">Ventas totales</div>
        <div class="stat-value">${fmt(s.totalSales)}</div>
        <div class="small muted">${state.sales.length} ventas</div>
      </div>

      <div class="card">
        <div class="stat-label">Compras totales</div>
        <div class="stat-value">${fmt(s.totalPurchases)}</div>
        <div class="small muted">${state.purchases.length} compras</div>
      </div>

      <div class="card">
        <div class="stat-label">Ganancia neta</div>
        <div class="stat-value" style="color:var(--green)">
          ${fmt(s.totalProfit)}
        </div>
      </div>

      <div class="card">
        <div class="stat-label">Disponible</div>
        <div class="stat-value">
          ${fmt(s.availableMoney)}
        </div>
      </div>

    </div>

  </div>


  <div class="section-head">
    <h2>Movimientos</h2>
  </div>


  <div class="px">

    <div class="card history-card">

      ${
        state.transactions.length

        ? state.transactions.map(tx=>`

          <div class="list-item">

            <div class="list-icon">
              ${tx.type==="sale"?"↗":"↙"}
            </div>

            <div class="transaction-info">

              <b>${tx.description}</b>

              <div class="small muted">

                ${new Date(tx.date).toLocaleDateString(
                  "es-MX",
                  {
                    day:"numeric",
                    month:"short"
                  }
                )}

                ·

                ${new Date(tx.date).toLocaleTimeString(
                  "es-MX",
                  {
                    hour:"2-digit",
                    minute:"2-digit"
                  }
                )}

              </div>

            </div>

            <b style="color:${tx.amount>=0?"var(--green)":"var(--red)"}">

              ${tx.amount>=0?"+":""}${fmt(tx.amount)}

            </b>

          </div>

        `).join("")

        : `
          <div class="empty">
            Aún no hay movimientos.
          </div>
        `
      }

    </div>

  </div>

  `;
}


/* =========================
   CALCULADORA
========================= */

function calculator(){

  return `

  ${header("Calculadora","Estima tus ganancias")}

  <div class="px">

    <div class="card">

      <div class="calc-tabs">

        <button
          class="${window.calcMode!=="basic"?"active":""}"
          onclick="calcMode='business';go('calculator')"
        >
          Negocio
        </button>

        <button
          class="${window.calcMode==="basic"?"active":""}"
          onclick="calcMode='basic';go('calculator')"
        >
          Calculadora
        </button>

      </div>

      ${
        window.calcMode!=="basic"
          ? businessCalc()
          : basicCalc()
      }

    </div>

  </div>

  `;
}

function businessCalc(){

  const b =
    window.calcB ?? 35;

  const p =
    window.calcP ?? state.settings.defaultPrice;

  const c =
    window.calcC ?? "";

  const e =
    window.calcE ?? 0;

  const auto =
    b *
    state.settings.gramsPerBag /
    1000 *
    state.settings.defaultCostPerKg;

  const cost =
    c === "" ? auto : +c;

  const total =
    b*p;

  const profit =
    total-cost-e;

  const per =
    b ? profit/b : 0;

  const remain =
    Math.max(
      state.settings.profitGoal -
      stats().totalProfit,
      0
    );

  const need =
    per>0
      ? Math.ceil(remain/per)
      : 0;

  const days =
    b
      ? Math.ceil(need/b)
      : 0;

  return `

    <div class="stat-label">
      Simulación de venta
    </div>


    <div class="field calculator-field">

      <label>Bolsitas a vender</label>

      <input
        class="input"
        type="number"
        value="${b}"
        oninput="calcB=+this.value;updateBusinessCalc()"
      >

    </div>


    <div class="field">

      <label>Precio por bolsita</label>

      <input
        class="input"
        type="number"
        value="${p}"
        oninput="calcP=+this.value;updateBusinessCalc()"
      >

    </div>


    <div class="field">

      <label>Costo del producto</label>

      <input
        class="input"
        type="number"
        value="${c}"
        placeholder="Calculado automático"
        oninput="calcC=this.value;updateBusinessCalc()"
      >

    </div>


    <div class="field">

      <label>Otros costos</label>

      <input
        class="input"
        type="number"
        value="${e}"
        oninput="calcE=+this.value;updateBusinessCalc()"
      >

    </div>


    <div class="calculator-result">

      <div class="row">
        <span>Venta total</span>
        <b>${fmt(total)}</b>
      </div>

      <div class="row">
        <span>Costo total</span>
        <b class="red-text">−${fmt(cost+e)}</b>
      </div>

      <hr>

      <div class="row">

        <b>Ganancia estimada</b>

        <b
          class="calculator-profit"
          style="color:${profit>=0?"var(--green)":"var(--red)"}"
        >
          ${fmt(profit)}
        </b>

      </div>

      <div class="small muted calculator-per">
        ${fmt(per)} por bolsita
      </div>

    </div>


    ${
      remain>0 && per>0

      ? `
        <div class="card goal-card">

          <b>¿Cuánto necesito vender?</b>

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

function updateBusinessCalc(){

  const container =
    document.querySelector(".calculator-field")?.parentElement;

  if(container){
    /*
      Se vuelve a dibujar la pantalla para mantener
      la calculadora sincronizada.
    */
    render();
  }
}


/* =========================
   CALCULADORA BÁSICA
========================= */

function basicCalc(){

  const keys = [
    "C","%","÷",
    "7","8","9","×",
    "4","5","6","−",
    "1","2","3","+",
    "0",".","="
  ];

  return `

    <div class="calc-display">

      <div class="value">
        ${window.calcDisplay || "0"}
      </div>

    </div>


    <div class="keys">

      ${keys.map(k=>`

        <button
          class="key
            ${["÷","×","−","+"].includes(k)?"op":""}
            ${["C","%"].includes(k)?"special":""}
            ${k==="="?"equal":""}
          "
          onclick="calcPress('${k}')"
        >
          ${k}
        </button>

      `).join("")}

    </div>

  `;
}


/* =========================
   DISTRIBUCIÓN
========================= */

function distribution(){

  const last = state.sales[0];

  if(!last){

    return `

      ${header("Distribución","Divide tu dinero")}

      <div class="px">

        <div class="card empty">

          📊

          <br>

          <b>Sin ventas aún</b>

          <p>
            Registra tu primera venta para
            ver la distribución.
          </p>

        </div>

      </div>

    `;
  }

  const total = last.total;
  const rest = last.forRestock;
  const profit = last.profit;

  return `

    ${header("Distribución","Divide tu dinero")}

    <div class="px">

      <div class="card">

        <div class="stat-label">
          Resumen acumulado
        </div>

        <div class="grid2 distribution-grid">

          <div>
            <div class="small muted">Ventas</div>
            <b>${fmt(stats().totalSales)}</b>
          </div>

          <div>
            <div class="small muted">Ganancia</div>
            <b>${fmt(stats().totalProfit)}</b>
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
          <span>Para reponer</span>
          <b>${fmt(rest)}</b>
        </div>

        <div class="row distribution-row">
          <span>Ganancia</span>
          <b style="color:var(--green)">
            ${fmt(profit)}
          </b>
        </div>

        <div class="progress distribution-progress">

          <div
            style="width:${total?rest/total*100:0}%"
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


/* =========================
   AJUSTES
========================= */

function settings(){

  return `

  ${header("Ajustes","Configura tu negocio")}

  <div class="px">

    <div class="card">

      <div class="stat-label">
        Configuración financiera
      </div>


      <div class="field settings-first">

        <label>Meta de ganancia</label>

        <input
          id="set-goal"
          class="input"
          type="number"
          value="${state.settings.profitGoal}"
        >

      </div>


      <div class="field">

        <label>Precio por bolsita</label>

        <input
          id="set-price"
          class="input"
          type="number"
          value="${state.settings.defaultPrice}"
        >

      </div>


      <div class="field">

        <label>Costo por Kg</label>

        <input
          id="set-cost"
          class="input"
          type="number"
          value="${state.settings.defaultCostPerKg}"
        >

      </div>


      <div class="field">

        <label>Gramos por bolsita</label>

        <input
          id="set-grams"
          class="input"
          type="number"
          value="${state.settings.gramsPerBag}"
        >

      </div>


      <div class="checkbox-row">

        <b>Cálculo automático</b>

        <button
          class="toggle ${state.settings.autoCalculation?"on":""}"
          onclick="
            state.settings.autoCalculation=!state.settings.autoCalculation;
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

      <b>Zona de peligro</b>

      <p class="small muted">
        Borra todas las ventas, compras e inventario.
      </p>

      <button
        class="danger full"
        onclick="resetData()"
      >
        Restablecer datos
      </button>

    </div>


    <div class="app-version">

      🍬 Gummy Ware<br>
      Compila tu Antojo<br>
      v1.1.0 • Datos guardados localmente

    </div>

  </div>

  `;
}

function saveSettings(){

  state.settings.profitGoal =
    +document.querySelector("#set-goal").value || 0;

  state.settings.defaultPrice =
    +document.querySelector("#set-price").value || 0;

  state.settings.defaultCostPerKg =
    +document.querySelector("#set-cost").value || 0;

  state.settings.gramsPerBag =
    +document.querySelector("#set-grams").value || 0;

  save();

  toast("Ajustes guardados");

  go("settings");
}


/* =========================
   MODALES
========================= */

function goalModal(){

  modal(`

    <h2>¿Cuánto quieres ganar?</h2>

    <div class="field">

      <label>Meta de ganancia</label>

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
        state.settings.profitGoal=
        +document.querySelector('#goal-modal').value||0;
        save();
        closeModal();
        go('home')
      "
    >
      Guardar meta
    </button>

  `);
}

function modal(body){

  const d = document.createElement("div");

  d.id = "modal";
  d.className = "modal-backdrop";

  d.innerHTML = `

    <div class="modal-sheet">

      <div class="modal-top">

        <b>GummyWare</b>

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

function closeModal(){

  document.querySelector("#modal")?.remove();
}

function toast(msg){

  const d = document.createElement("div");

  d.className = "toast";
  d.textContent = msg;

  document.body.appendChild(d);

  setTimeout(()=>d.remove(),2400);
}


/* =========================
   DATOS
========================= */

function exportData(){

  const blob = new Blob(
    [JSON.stringify(state,null,2)],
    {type:"application/json"}
  );

  const a = document.createElement("a");

  a.href = URL.createObjectURL(blob);
  a.download = "gummyware-backup.json";

  a.click();

  URL.revokeObjectURL(a.href);
}

function importData(e){

  const f = e.target.files[0];

  if(!f) return;

  const r = new FileReader();

  r.onload = ()=>{

    try{

      state = JSON.parse(r.result);

      save();

      go("settings");

      toast("Datos importados");

    }catch{

      toast("Archivo inválido");

    }

  };

  r.readAsText(f);
}

function resetData(){

  if(
    confirm(
      "Esta acción no se puede deshacer. ¿Restablecer GummyWare?"
    )
  ){

    state = structuredClone(INITIAL);

    save();

    go("home");

  }
}


/* =========================
   VARIABLES GLOBALES
========================= */

window.go = function(s){
  screen = s;
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

window.calcMode = "business";
window.calcDisplay = "0";
window.calcPrev = null;
window.calcOp = null;
window.calcFresh = false;

window.calcB = 35;
window.calcP = state.settings.defaultPrice;
window.calcC = "";
window.calcE = 0;


/* =========================
   CALCULADORA
========================= */

function calcPress(k){

  if(k==="C"){

    calcDisplay="0";
    calcPrev=null;
    calcOp=null;
    calcFresh=false;

  }

  else if(k==="%"){

    calcDisplay =
      String(+calcDisplay/100);

  }

  else if(["+","−","×","÷"].includes(k)){

    calcPrev=+calcDisplay;
    calcOp=k;
    calcFresh=true;

  }

  else if(k==="="){

    if(calcPrev==null || !calcOp){
      return;
    }

    const b = +calcDisplay;

    let r =
      calcOp==="+" ? calcPrev+b :
      calcOp==="−" ? calcPrev-b :
      calcOp==="×" ? calcPrev*b :
      b ? calcPrev/b : 0;

    calcDisplay =
      String(Number(r.toFixed(8)));

    calcPrev=null;
    calcOp=null;

  }

  else if(k==="."){

    if(!calcDisplay.includes(".")){
      calcDisplay += ".";
    }

  }

  else{

    calcDisplay =
      calcFresh
        ? k
        : calcDisplay==="0"
        ? k
        : calcDisplay+k;

    calcFresh=false;
  }

  go("calculator");
}

window.calcPress = calcPress;


/* =========================
   RENDER
========================= */

function render(){

  let c =
    screen==="home"
      ? home()
      : screen==="new-sale"
      ? newSale()
      : screen==="new-purchase"
      ? purchase()
      : screen==="inventory"
      ? inventory()
      : screen==="history"
      ? history()
      : screen==="calculator"
      ? calculator()
      : screen==="distribution"
      ? distribution()
      : settings();

  shell(c);

  if(screen==="new-sale"){

    const bags =
      document.querySelector("#sale-bags");

    const price =
      document.querySelector("#sale-price");

    if(bags) bags.addEventListener("input",updateSale);
    if(price) price.addEventListener("input",updateSale);

    updateSale();
  }
}

render();


/* ==========================================================
   INTRO / VIDEO
========================================================== */

function startIntro(){

  const splash =
    document.querySelector("#splash");

  const v =
    document.querySelector("#intro-video");

  const soundBtn =
    document.querySelector("#intro-sound");

  if(!splash || !v){
    return;
  }


  const mobile =
    window.matchMedia("(max-width:699px)").matches ||
    /Android|iPhone|iPad|iPod|Mobile/i.test(
      navigator.userAgent
    );


  /*
    IMPORTANTE:

    Los archivos deben estar exactamente aquí:

    assets/intro-mobile.mp4
    assets/intro-desktop.mp4
  */

  const videoPath =
    mobile
      ? "./assets/intro-mobile.mp4"
      : "./assets/intro-desktop.mp4";

  v.src = videoPath;

  v.setAttribute("playsinline","");
  v.setAttribute("webkit-playsinline","");

  /*
    Primero intentamos sonido.
    Si el navegador lo bloquea, mostramos
    el botón para que el usuario lo active.
  */

  v.muted = false;
  v.volume = 1;

  let done = false;

  function finish(){

    if(done) return;

    done = true;

    splash.classList.add("splash-hide");

    setTimeout(()=>{
      splash.remove();
    },400);
  }


  function showSoundButton(){

    if(!soundBtn || done) return;

    soundBtn.classList.add("show");
  }


  function hideSoundButton(){

    if(!soundBtn) return;

    soundBtn.classList.remove("show");
  }


  function playVideo(){

    v.muted = false;
    v.volume = 1;

    const promise = v.play();

    if(promise){

      promise
        .then(()=>{
          hideSoundButton();
        })
        .catch(()=>{

          /*
            Algunos navegadores bloquean autoplay
            con sonido.
          */

          v.muted = true;

          const mutedPlay = v.play();

          if(mutedPlay){

            mutedPlay
              .then(()=>{
                showSoundButton();
              })
              .catch(()=>{
                showSoundButton();
              });

          }else{

            showSoundButton();

          }

        });

    }

  }


  if(soundBtn){

    soundBtn.addEventListener("click",()=>{

      v.muted = false;
      v.volume = 1;

      const promise = v.play();

      if(promise){

        promise
          .then(()=>{
            hideSoundButton();
          })
          .catch(()=>{
            showSoundButton();
          });

      }

    });

  }


  v.addEventListener(
    "ended",
    finish,
    {once:true}
  );


  v.addEventListener(
    "error",
    ()=>{

      /*
        Si el MP4 no existe, mostramos
        la pantalla alternativa y continuamos.
      */

      const fallback =
        document.querySelector(".splash-fallback");

      if(fallback){
        fallback.style.display = "flex";
      }

      if(soundBtn){
        soundBtn.classList.remove("show");
      }

      setTimeout(finish,1800);

    },
    {once:true}
  );


  /*
    Seguridad:
    si el video tarda demasiado en cargar,
    no dejamos la app bloqueada.
  */

  setTimeout(()=>{

    if(!done && v.readyState === 0){

      const fallback =
        document.querySelector(".splash-fallback");

      if(fallback){
        fallback.style.display="flex";
      }

      setTimeout(finish,1200);

    }

  },8000);


  playVideo();
}


/* ==========================================================
   INSTALACIÓN PWA
========================================================== */

let deferredInstallPrompt = null;


function setupPWAInstall(){

  const installButton =
    document.querySelector("#install-app");

  /*
    Android / Chrome / Edge
  */

  window.addEventListener(
    "beforeinstallprompt",
    e=>{

      e.preventDefault();

      deferredInstallPrompt = e;

      if(installButton){

        installButton.style.display = "flex";

      }

    }
  );


  /*
    Usuario instala la aplicación
  */

  window.addEventListener(
    "appinstalled",
    ()=>{

      deferredInstallPrompt = null;

      if(installButton){
        installButton.style.display = "none";
      }

      toast("GummyWare instalada correctamente 🍬");

    }
  );


  /*
    iPhone / iPad
  */

  const isIOS =
    /iPhone|iPad|iPod/i.test(navigator.userAgent);

  const isStandalone =
    window.navigator.standalone === true ||
    window.matchMedia(
      "(display-mode: standalone)"
    ).matches;


  if(
    isIOS &&
    !isStandalone &&
    installButton
  ){

    installButton.style.display = "flex";

    installButton.textContent =
      "📲 Cómo instalar GummyWare";

  }


  /*
    Botón de instalación
  */

  if(installButton){

    installButton.addEventListener(
      "click",
      async ()=>{

        /*
          Android / Chrome / Edge
        */

        if(deferredInstallPrompt){

          deferredInstallPrompt.prompt();

          const choice =
            await deferredInstallPrompt.userChoice;

          if(choice.outcome==="accepted"){
            toast("Instalando GummyWare...");
          }

          deferredInstallPrompt = null;

          installButton.style.display="none";

          return;
        }


        /*
          iPhone / iPad
        */

        if(isIOS){

          modal(`

            <h2>Instalar GummyWare 📲</h2>

            <p class="install-text">

              En tu iPhone o iPad:

            </p>

            <div class="install-step">
              <b>1.</b>
              Toca el botón
              <b>Compartir</b>
              de Safari.
            </div>

            <div class="install-step">
              <b>2.</b>
              Busca
              <b>“Agregar a pantalla de inicio”</b>.
            </div>

            <div class="install-step">
              <b>3.</b>
              Toca
              <b>Agregar</b>.
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


        toast(
          "Para instalarla, usa el menú de tu navegador."
        );

      }
    );

  }


  /*
    Si ya está instalada como PWA,
    ocultamos el botón.
  */

  if(isStandalone && installButton){

    installButton.style.display = "none";

  }

}


/* ==========================================================
   SERVICE WORKER
========================================================== */

if("serviceWorker" in navigator){

  window.addEventListener(
    "load",
    ()=>{

      navigator.serviceWorker
        .register("./sw.js")
        .catch(err=>{
          console.warn(
            "Service Worker:",
            err
          );
        });

    }
  );

}


/* ==========================================================
   INICIAR
========================================================== */

window.addEventListener(
  "DOMContentLoaded",
  ()=>{

    startIntro();

    setupPWAInstall();

  }
);

const state = {
  settings: {
    profitGoal: 1450,
    defaultPrice: 15,
    defaultCostPerKg: 95,
    gramsPerBag: 50,
    autoCalculation: true
  },
  sales: [],
  purchases: [],
  transactions: [],
  inventory: []
};

const $ = s => document.querySelector(s);

function money(n){
  return new Intl.NumberFormat("es-MX",{style:"currency",currency:"MXN"}).format(Number(n)||0);
}

function computeStats(){
  const sales = state.sales.reduce((a,x)=>a+(Number(x.total)||0),0);
  const purchases = state.purchases.reduce((a,x)=>a+(Number(x.cost)||0),0);
  const profit = state.sales.reduce((a,x)=>a+(Number(x.profit)||0),0);
  return {
    sales, purchases, profit,
    available: sales-purchases,
    goalProgress: state.settings.profitGoal > 0
      ? Math.min((profit/state.settings.profitGoal)*100,100) : 0
  };
}

function renderHome(){
  const s=computeStats();
  $("#screen").innerHTML=`
    <header class="header">
      <h1>Gummy Ware</h1>
      <p>Compila tu Antojo</p>
    </header>
    <section class="card">
      <div class="stat-label">META DE GANANCIA</div>
      <div class="stat-value">${money(s.profit)}</div>
      <div style="color:var(--muted);font-size:13px;margin-top:5px">
        Meta: ${money(state.settings.profitGoal)}
      </div>
      <div style="height:9px;background:#F0EFF2;border-radius:10px;margin-top:14px;overflow:hidden">
        <div style="height:100%;width:${s.goalProgress}%;background:var(--pink);border-radius:10px"></div>
      </div>
      <div style="font-size:12px;color:var(--muted);margin-top:7px">${Math.round(s.goalProgress)}% completado</div>
    </section>
    <div class="stat-grid">
      <div class="card"><div class="stat-label">VENTAS</div><div class="stat-value">${money(s.sales)}</div></div>
      <div class="card"><div class="stat-label">DISPONIBLE</div><div class="stat-value">${money(s.available)}</div></div>
    </div>
    <section class="card">
      <button class="primary" onclick="navigate('sale')">＋ Registrar venta</button>
      <button class="secondary" style="width:100%;margin-top:10px" onclick="navigate('purchase')">＋ Registrar compra</button>
    </section>
    <section class="card">
      <b>GummyWare</b>
      <p style="color:var(--muted);font-size:13px">Tu antojo, bajo control.</p>
    </section>`;
}

function renderSale(){
  $("#screen").innerHTML=`
    <header class="header"><h1>Nueva venta</h1><p>Registra una venta</p></header>
    <section class="card">
      <label>Bolsitas</label>
      <input id="bags" type="number" inputmode="decimal" value="20" style="width:100%;padding:15px;margin:8px 0 15px;border:1px solid var(--line);border-radius:15px">
      <label>Precio por bolsita</label>
      <input id="price" type="number" inputmode="decimal" value="${state.settings.defaultPrice}" style="width:100%;padding:15px;margin:8px 0 15px;border:1px solid var(--line);border-radius:15px">
      <div id="saleTotal" style="font-size:25px;font-weight:900;margin-bottom:15px">${money(20*state.settings.defaultPrice)}</div>
      <button class="primary" onclick="saveSale()">Guardar venta</button>
    </section>`;
  ["bags","price"].forEach(id=>$("#"+id).addEventListener("input",updateSaleTotal));
}
function updateSaleTotal(){
  const bags=Number($("#bags").value)||0, price=Number($("#price").value)||0;
  $("#saleTotal").textContent=money(bags*price);
}
function saveSale(){
  const bags=Number($("#bags").value)||0, price=Number($("#price").value)||0;
  if(bags<=0||price<=0)return alert("Ingresa una cantidad y precio válidos.");
  const total=bags*price;
  const cost=(bags*state.settings.gramsPerBag/1000)*state.settings.defaultCostPerKg;
  const sale={id:Date.now(),date:new Date().toISOString(),bagsCount:bags,pricePerBag:price,total,costUsed:cost,profit:total-cost};
  state.sales.unshift(sale);
  state.transactions.unshift({id:Date.now()+1,date:sale.date,type:"sale",amount:total,saleId:sale.id});
  persist();
  navigate("home");
}

function renderSimple(title,subtitle,content){
  $("#screen").innerHTML=`<header class="header"><h1>${title}</h1><p>${subtitle}</p></header>${content}`;
}
function renderInventory(){
  renderSimple("Inventario","Controla tus productos",`
    <section class="card"><b>Inventario</b><div class="empty">Aquí se integrará el inventario completo conservando la lógica de tu versión React.</div></section>
    <button class="primary" onclick="navigate('purchase')">＋ Nueva compra</button>`);
}
function renderHistory(){
  let rows=state.transactions.map(t=>`<div style="display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid var(--line)"><span>${t.type==="sale"?"Venta":"Compra"}</span><b>${t.type==="sale"?"+":"−"}${money(t.amount)}</b></div>`).join("");
  renderSimple("Historial","Tus movimientos",`<section class="card">${rows||'<div class="empty">Todavía no hay movimientos.</div>'}</section>`);
}
function renderPurchase(){
  renderSimple("Nueva compra","Registra una compra",`
    <section class="card">
      <label>Producto</label>
      <input id="product" value="Gomitas" style="width:100%;padding:15px;margin:8px 0 15px;border:1px solid var(--line);border-radius:15px">
      <label>Costo</label>
      <input id="purchaseCost" type="number" inputmode="decimal" style="width:100%;padding:15px;margin:8px 0 15px;border:1px solid var(--line);border-radius:15px">
      <button class="primary" onclick="savePurchase()">Guardar compra</button>
    </section>`);
}
function savePurchase(){
  const cost=Number($("#purchaseCost").value)||0;
  if(cost<=0)return alert("Ingresa un costo válido.");
  const p={id:Date.now(),date:new Date().toISOString(),product:$("#product").value,cost};
  state.purchases.unshift(p);
  state.transactions.unshift({id:Date.now()+1,date:p.date,type:"purchase",amount:cost,purchaseId:p.id});
  persist();navigate("home");
}
function renderSettings(){
  renderSimple("Ajustes","Configura GummyWare",`
    <section class="card">
      <label>Meta de ganancia</label>
      <input id="goal" type="number" value="${state.settings.profitGoal}" style="width:100%;padding:15px;margin:8px 0 15px;border:1px solid var(--line);border-radius:15px">
      <label>Precio por bolsita</label>
      <input id="defaultPrice" type="number" value="${state.settings.defaultPrice}" style="width:100%;padding:15px;margin:8px 0 15px;border:1px solid var(--line);border-radius:15px">
      <label>Costo por kg</label>
      <input id="costKg" type="number" value="${state.settings.defaultCostPerKg}" style="width:100%;padding:15px;margin:8px 0 15px;border:1px solid var(--line);border-radius:15px">
      <label>Gramos por bolsita</label>
      <input id="grams" type="number" value="${state.settings.gramsPerBag}" style="width:100%;padding:15px;margin:8px 0 20px;border:1px solid var(--line);border-radius:15px">
      <button class="primary" onclick="saveSettings()">Guardar cambios</button>
    </section>`);
}
function saveSettings(){
  state.settings.profitGoal=Number($("#goal").value)||0;
  state.settings.defaultPrice=Number($("#defaultPrice").value)||0;
  state.settings.defaultCostPerKg=Number($("#costKg").value)||0;
  state.settings.gramsPerBag=Number($("#grams").value)||0;
  persist();navigate("home");
}

function load(){
  try{
    const saved=localStorage.getItem("gummyware");
    if(saved) Object.assign(state,JSON.parse(saved));
  }catch(e){}
}
function persist(){localStorage.setItem("gummyware",JSON.stringify(state));}

function navigate(screen){
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.screen===screen));
  if(screen==="home")renderHome();
  if(screen==="sale")renderSale();
  if(screen==="inventory")renderInventory();
  if(screen==="history")renderHistory();
  if(screen==="settings")renderSettings();
  if(screen==="purchase")renderPurchase();
}
document.querySelectorAll(".nav-item").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.screen)));

function startSplash(){
  const video=$("#splashVideo");
  const mobile=window.matchMedia("(max-width: 699px)").matches || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  video.src=mobile ? "videos/intro-mobile.mp4" : "videos/intro-desktop.mp4";
  let finished=false;
  const enter=()=>{
    if(finished)return;
    finished=true;
    $("#splash").style.opacity="0";
    $("#splash").style.transition="opacity .35s ease";
    setTimeout(()=>$("#splash").remove(),350);
    $("#app").classList.remove("hidden");
    navigate("home");
  };
  video.addEventListener("ended",enter,{once:true});
  video.addEventListener("error",()=>setTimeout(enter,1200),{once:true});
  setTimeout(enter,15000);
  video.play().catch(()=>{});
}

load();
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
startSplash();

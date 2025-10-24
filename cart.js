
/* cart.js - simple frontend shop logic (bilingual, dual currency display) */
const PRODUCTS = [
  {id:'g1', ar:'عقيق يمني', en:'Yemeni Agate', price:10, img:'images/agate.jpg', desc_ar:'قطعة عقيق طبيعية مع لمعان خفيف', desc_en:'Natural agate specimen', stock:5},
  {id:'g2', ar:'أوبال ناري', en:'Fire Opal', price:120, img:'images/opal.jpg', desc_ar:'أوبال ناري ذو ألوان برتقالية', desc_en:'Bright fire opal', stock:2},
  {id:'g3', ar:'زمرد صغير', en:'Small Emerald', price:400, img:'images/emerald.jpg', desc_ar:'زمرد طبيعي مقطوع', desc_en:'Cut emerald sample', stock:1},
  {id:'g4', ar:'كوارتز دخاني', en:'Smoky Quartz', price:8, img:'images/quartz.jpg', desc_ar:'كوارتز دخاني طبيعي', desc_en:'Smoky quartz sample', stock:12},
];

let lang = localStorage.getItem('et_lang') || 'ar';
let showUSD = true;
let showDZD = true;
let rate = parseFloat(localStorage.getItem('et_rate')||'140');
let cart = JSON.parse(localStorage.getItem('et_cart')||'[]');

const $ = s=>document.querySelector(s);
const $$ = s=>Array.from(document.querySelectorAll(s));

function fmtUSD(v){return '$'+v.toFixed(2);}
function fmtDZD(v){return Math.round(v*rate)+' د.ج';}

function render(){
  $('#lang').value = lang;
  $('#show-dzd').checked = showDZD;
  $('#show-usd').checked = showUSD;
  const container = $('#products');
  container.innerHTML='';
  PRODUCTS.forEach(p=>{
    const div = document.createElement('article');
    div.className='card';
    div.innerHTML = `
      <img src="${p.img}" data-id="${p.id}" alt="${p.en}" class="zoom">
      <h4>${lang==='ar'?p.ar:p.en}</h4>
      <p>${lang==='ar'?p.desc_ar:p.desc_en}</p>
      <div class="price">
        <div class="prices">${showUSD?fmtUSD(p.price):''} ${showDZD?fmtDZD(p.price):''}</div>
        <div><button class="primary add" data-id="${p.id}">${lang==='ar'?'أضف إلى السلة':'Add to cart'}</button></div>
      </div>
    `;
    container.appendChild(div);
  });
  $$('.add').forEach(b=>b.addEventListener('click',e=> add(e.target.dataset.id)));
  $$('.zoom').forEach(i=> i.addEventListener('click', e=> openViewer(e.target.src)));
  renderCart();
}

function add(id){
  const p = PRODUCTS.find(x=>x.id===id);
  const found = cart.find(x=>x.id===id);
  if(found){ if(found.qty < p.stock) found.qty++; }
  else cart.push({id:id, title: lang==='ar'?p.ar:p.en, price:p.price, qty:1});
  save(); renderCart();
}

function save(){ localStorage.setItem('et_cart', JSON.stringify(cart)); }
function renderCart(){
  $('#count').textContent = cart.reduce((s,i)=>s+i.qty,0);
  const items = $('#items'); items.innerHTML='';
  if(cart.length===0){ items.innerHTML='<p style="color:#6b7280">السلة فارغة</p>'; $('#total').textContent = '$0'; $('#total-dzd').textContent='0 د.ج'; return; }
  cart.forEach(it=>{
    const p = PRODUCTS.find(x=>x.id===it.id);
    const div = document.createElement('div');
    div.style.marginBottom='.6rem';
    div.innerHTML = `<div style="display:flex;gap:.5rem;align-items:center"><img src="${p.img}" style="width:64px;height:48px;object-fit:cover;border-radius:6px"><div style="flex:1"><strong>${it.title}</strong><div style="color:#6b7280">${showUSD?fmtUSD(it.price):''} ${showDZD?fmtDZD(it.price):''}</div></div><div><input type="number" min="1" max="${p.stock}" value="${it.qty}" data-id="${it.id}" style="width:60px"></div><div><button data-id="${it.id}" class="remove">حذف</button></div></div>`;
    items.appendChild(div);
  });
  $$('#items .remove').forEach(b=> b.addEventListener('click', e=>{ cart = cart.filter(x=> x.id!==e.target.dataset.id); save(); renderCart(); }));
  $$('#items input[type="number"]').forEach(i=> i.addEventListener('change', e=>{ const id=e.target.dataset.id; const v=parseInt(e.target.value||'1'); cart = cart.map(x=> x.id===id? {...x, qty: Math.max(1, Math.min(v, PRODUCTS.find(p=>p.id===id).stock))} : x); save(); renderCart(); }));
  const total = cart.reduce((s,i)=>s+i.price*i.qty,0);
  $('#total').textContent = fmtUSD(total);
  $('#total-dzd').textContent = fmtDZD(total);
}

function openViewer(src){ $('#vimg').src = src; $('#viewer').classList.remove('hidden'); }
function closeViewer(){ $('#vimg').src=''; $('#viewer').classList.add('hidden'); }

function bind(){
  $('#cart-btn').addEventListener('click', ()=> $('#cart').classList.toggle('hidden'));
  $('#checkout').addEventListener('click', ()=> $('#checkout-modal').classList.remove('hidden'));
  $('#clear').addEventListener('click', ()=> { cart=[]; save(); renderCart(); });
  $('#close').addEventListener('click', ()=> $('#checkout-modal').classList.add('hidden'));
  $('#cancel').addEventListener('click', ()=> $('#checkout-modal').classList.add('hidden'));
  $('#lang').addEventListener('change', e=> { lang=e.target.value; localStorage.setItem('et_lang', lang); render(); });
  $('#show-dzd').addEventListener('change', e=> { showDZD=e.target.checked; localStorage.setItem('et_showdzd', showDZD); render(); });
  $('#show-usd').addEventListener('change', e=> { showUSD=e.target.checked; localStorage.setItem('et_showusd', showUSD); render(); });
  $('#form').addEventListener('submit', e=> { e.preventDefault(); place(); });
  $('#vclose').addEventListener('click', closeViewer);
  document.addEventListener('keydown', e=> { if(e.key==='Escape') closeViewer(); });
  // load saved
  if(localStorage.getItem('et_rate')) rate = parseFloat(localStorage.getItem('et_rate'));
  if(localStorage.getItem('et_showdzd')) showDZD = (localStorage.getItem('et_showdzd')==='true');
  if(localStorage.getItem('et_showusd')) showUSD = (localStorage.getItem('et_showusd')==='true');
  render();
}

function place(){
  const data = Object.fromEntries(new FormData($('#form')).entries());
  if(!data.name||!data.email||!data.phone||!data.address){ alert(lang==='ar'?'أكمل الحقول':'Complete fields'); return; }
  if(cart.length===0){ alert(lang==='ar'?'السلة فارغة':'Cart empty'); return; }
  const order = { id:'ORD-'+Date.now(), customer:data, items:cart, total_usd: cart.reduce((s,i)=>s+i.price*i.qty,0), total_dzd: Math.round(cart.reduce((s,i)=>s+i.price*i.qty,0)*rate) };
  const orders = JSON.parse(localStorage.getItem('et_orders')||'[]'); orders.push(order); localStorage.setItem('et_orders', JSON.stringify(orders));
  const blob = new Blob([JSON.stringify(order, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = order.id + '.json'; a.click(); URL.revokeObjectURL(url);
  alert(lang==='ar'?'تم إنشاء الطلب. سنراسلُك عبر البريد':'Order placed. We will contact you by email');
  cart = []; save(); renderCart(); $('#checkout-modal').classList.add('hidden');
}

bind();

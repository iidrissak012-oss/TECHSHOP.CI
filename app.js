// ================================================================
// TECHSHOP CI — app.js  (SITE CLIENT UNIQUEMENT)
// ================================================================

// ====== CONFIG SUPABASE ======
// Remplacez par vos vraies valeurs : supabase.com → projet → Settings → API
const SUPABASE_URL = 'https://ocmzwpfhahbtckgpudil.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jbXp3cGZoYWhidGNrZ3B1ZGlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwNTIzNDksImV4cCI6MjA5NjYyODM0OX0.7viph-J44nP-WgAde1DiC1Tu4bMj718eobqIMvmSlyI';

let sb = null;
let products = [];
let currentBoutiqueTab = 'phones';
let waNumber = '+2250710878025';

// ====== PRODUITS PAR DÉFAUT (si Supabase pas encore configuré) ======
const DEFAULT_PRODUCTS = [
  { id:1,  name:'iPhone 15 Pro Max',       cat:'phones',        price:750000, brand:'Apple',    image:'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=80', description:'256GB, Titanium, 48MP ProRAW, puce A17 Pro', available:true },
  { id:2,  name:'iPhone 14',               cat:'phones',        price:450000, brand:'Apple',    image:'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80', description:'128GB, Super Retina XDR, A15 Bionic', available:true },
  { id:3,  name:'Samsung Galaxy S24 Ultra',cat:'phones',        price:620000, brand:'Samsung',  image:'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=900&q=80', description:'256GB, S-Pen inclus, 200MP, IA intégrée', available:true },
  { id:4,  name:'Samsung Galaxy A54',      cat:'phones',        price:180000, brand:'Samsung',  image:'https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=900&q=80', description:'128GB, AMOLED 6.4", 50MP, 5000mAh', available:true },
  { id:5,  name:'Tecno Camon 20 Pro',      cat:'phones',        price:145000, brand:'Tecno',    image:'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=900&q=80', description:'256GB, 64MP RGBW, charge 45W, AMOLED', available:true },
  { id:6,  name:'Infinix Note 40 Pro',     cat:'phones',        price:120000, brand:'Infinix',  image:'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=900&q=80', description:'256GB, 108MP, charge 45W, 6.78"', available:true },
  { id:7,  name:'Xiaomi Redmi Note 13 Pro',cat:'phones',        price:135000, brand:'Xiaomi',   image:'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&w=900&q=80', description:'256GB, 200MP, AMOLED 120Hz, 67W', available:true },
  { id:8,  name:'Oppo Reno 11',            cat:'phones',        price:210000, brand:'Oppo',     image:'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80', description:'256GB, 50MP Sony, 80W SuperVOOC', available:true },
  { id:9,  name:'AirPods Pro 2e Gén.',     cat:'accessories',   price:35000,  brand:'Apple',    image:'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=80', description:'Réduction de bruit active, Bluetooth 5.3', available:true },
  { id:10, name:'Samsung Buds2 Pro',        cat:'accessories',   price:22000,  brand:'Samsung',  image:'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80', description:'ANC Pro, 29h autonomie totale', available:true },
  { id:11, name:'Chargeur Rapide 65W',      cat:'accessories',   price:8500,   brand:'Baseus',   image:'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=80', description:'Charge rapide 65W, compatible tous téléphones', available:true },
  { id:12, name:'Powerbank 20000mAh',       cat:'accessories',   price:15000,  brand:'Anker',    image:'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=900&q=80', description:'20000mAh, 2 ports USB, charge rapide 22.5W', available:true },
  { id:13, name:'Coque iPhone 15 Premium',  cat:'accessories',   price:5000,   brand:'Générique',image:'https://images.unsplash.com/photo-1604671368394-2240d0b1bb6c?auto=format&fit=crop&w=900&q=80', description:'Protection MilSpec, transparente antireflet', available:true },
  { id:14, name:'Câble USB-C 2m Renforcé', cat:'accessories',   price:3500,   brand:'Baseus',   image:'https://images.unsplash.com/photo-1616410011236-7a42121dd981?auto=format&fit=crop&w=900&q=80', description:'Nylon tressé, 100W max, 2 mètres', available:true },
  { id:15, name:'Support Voiture Magné.',   cat:'accessories',   price:6000,   brand:'Baseus',   image:'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=900&q=80', description:'Magnétique 360°, compatible MagSafe', available:true },
  { id:16, name:'Verre Trempé Universel',   cat:'accessories',   price:2500,   brand:'Générique',image:'https://images.unsplash.com/photo-1601524909162-ae8725290836?auto=format&fit=crop&w=900&q=80', description:'9H, anti-empreintes, compatible tous modèles', available:true },
  { id:17, name:'TV LED 55" 4K Smart',     cat:'electromenager',price:320000, brand:'Hisense',  image:'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=900&q=80', description:'Dolby Atmos, Android TV, Wi-Fi, Bluetooth', available:true },
  { id:18, name:'TV LED 43" Full HD Smart',cat:'electromenager',price:185000, brand:'Samsung',  image:'https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=900&q=80', description:'Tizen OS, HDR, ports HDMI x2', available:true },
  { id:19, name:'Climatiseur 1.5CV',       cat:'electromenager',price:280000, brand:'LG',       image:'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80', description:'Inverter, classe A++, WiFi, télécommande', available:true },
  { id:20, name:'Réfrigérateur NoFrost 300L',cat:'electromenager',price:350000,brand:'Samsung', image:'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=900&q=80', description:'NoFrost, distributeur eau, A+', available:true },
  { id:21, name:'Machine à Laver 7kg',     cat:'electromenager',price:210000, brand:'LG',       image:'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=900&q=80', description:'Lave-linge frontal, 1400 tr/min, vapeur', available:true },
  { id:22, name:'Micro-ondes 25L Digital', cat:'electromenager',price:55000,  brand:'Hisense',  image:'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=900&q=80', description:'25L, 900W, fonction grill, digital', available:true },
  { id:23, name:'Fer à Repasser Vapeur',   cat:'electromenager',price:18000,  brand:'Philips',  image:'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?auto=format&fit=crop&w=900&q=80', description:'2600W, semelle céramique, anti-calcaire', available:true },
  { id:24, name:'Ventilateur Tour 45W',    cat:'electromenager',price:25000,  brand:'Générique',image:'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80', description:'Oscillation 90°, 3 vitesses, minuterie', available:true },
];

// ====== INIT ======
document.addEventListener('DOMContentLoaded', async () => {
  initSupabase();
  await loadProducts();
  renderFeaturedProducts();
  renderBoutiqueProducts();
  initNavbar();
});

function initSupabase() {
  try {
    if (window.supabase && !SUPABASE_URL.includes('VOTRE_PROJECT_ID')) {
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
  } catch(e) { console.warn('Mode démo (localStorage)'); }
}

async function loadProducts() {
  try {
    if (sb) {
      const { data, error } = await sb.from('products').select('*').order('id');
      if (!error && data && data.length > 0) { products = data; return; }
    }
    const saved = localStorage.getItem('ts_products');
    products = saved ? JSON.parse(saved) : [...DEFAULT_PRODUCTS];
    const savedWa = localStorage.getItem('ts_wa');
    if (savedWa) waNumber = savedWa;
  } catch(e) {
    products = [...DEFAULT_PRODUCTS];
  }
}

// ====== NAVIGATION ======
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page)?.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  document.querySelector('[data-page="' + page + '"]')?.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  document.getElementById('navLinks')?.classList.remove('open');
  if (page === 'boutique') renderBoutiqueProducts();
}

function showBoutique(tab) {
  currentBoutiqueTab = tab;
  showPage('boutique');
  ['phones','accessories','electromenager'].forEach(t => {
    document.getElementById('tab-' + t)?.classList.toggle('active', t === tab);
  });
  const titles = { phones:'📱 Téléphones', accessories:'🎧 Accessoires', electromenager:'🏠 Électroménager' };
  const el = document.getElementById('boutique-title');
  if (el) el.textContent = titles[tab];
  const si = document.getElementById('search-input');
  if (si) si.value = '';
  renderBoutiqueProducts();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function toggleMenu() {
  document.getElementById('navLinks')?.classList.toggle('open');
}

function initNavbar() {
  window.addEventListener('scroll', () => {
    document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 50);
  });
}

// ====== PRODUIT CARD ======
function formatPrice(p) { return Number(p).toLocaleString('fr-FR') + ' FCFA'; }

function createProductCard(product) {
  const desc = product.description || product.desc || '';
  const msg = encodeURIComponent('Bonjour ! Je suis intéressé(e) par :\n\n*' + product.name + '*\nPrix : ' + formatPrice(product.price) + '\n\nMerci de me donner plus d\'infos.');
  const waLink = 'https://wa.me/' + waNumber.replace(/\D/g,'') + '?text=' + msg;
  const card = document.createElement('div');
  card.className = 'product-card';
  card.innerHTML =
    '<div class="product-img">' +
      (product.image
        ? '<img src="' + product.image + '" alt="' + product.name + '" loading="lazy" onerror="this.parentNode.innerHTML=\'<div class=product-img-placeholder>Image indisponible</div>\'">'
        : '<div class="product-img-placeholder">Image à venir</div>') +
      (product.available === false ? '<span class="product-badge out">Rupture</span>' : '<span class="product-badge">En stock</span>') +
    '</div>' +
    '<div class="product-body">' +
      '<div class="product-brand">' + (product.brand || '') + '</div>' +
      '<div class="product-name">' + product.name + '</div>' +
      '<div class="product-desc">' + desc + '</div>' +
      '<div class="product-price">' + formatPrice(product.price) + '</div>' +
      (product.available !== false
        ? '<a href="' + waLink + '" target="_blank" class="btn-wa-product"><svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>Commander sur WhatsApp</a>'
        : '<button class="btn-wa-product out-stock" disabled>Rupture de stock</button>') +
    '</div>';
  return card;
}

function renderFeaturedProducts() {
  const c = document.getElementById('featured-products');
  if (!c) return;
  c.innerHTML = '';
  products.filter(p => p.available !== false).slice(0, 8).forEach(p => c.appendChild(createProductCard(p)));
}

function renderBoutiqueProducts() {
  const c = document.getElementById('boutique-products');
  if (!c) return;
  let list = products.filter(p => p.cat === currentBoutiqueTab);
  const q = document.getElementById('search-input')?.value.toLowerCase().trim();
  if (q) list = list.filter(p => (p.name+p.brand+(p.description||'')).toLowerCase().includes(q));
  const sort = document.getElementById('sort-select')?.value;
  if (sort === 'price-asc') list.sort((a,b) => a.price - b.price);
  if (sort === 'price-desc') list.sort((a,b) => b.price - a.price);
  if (sort === 'name') list.sort((a,b) => a.name.localeCompare(b.name));
  c.innerHTML = '';
  if (!list.length) {
    c.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:60px;color:#718096"><div style="font-size:3rem;margin-bottom:16px">🔍</div><h3>Aucun produit trouvé</h3></div>';
    return;
  }
  list.forEach(p => c.appendChild(createProductCard(p)));
}

function filterProducts() { renderBoutiqueProducts(); }

// ====== RÉPARATION ======
function submitRepairForm() {
  const v = id => document.getElementById(id)?.value.trim();
  const name=v('rep-name'), phone=v('rep-phone'), brand=v('rep-brand'),
        model=v('rep-model'), type=v('rep-type'), desc=v('rep-desc');
  const dropoff = document.querySelector('input[name="dropoff"]:checked')?.value || 'boutique';
  if (!name||!phone||!brand||!model||!type||!desc) {
    alert('⚠️ Veuillez remplir tous les champs obligatoires (*)'); return;
  }
  const msg = '*DEMANDE DE RÉPARATION — TechShop CI*\n\n👤 *Nom :* '+name+'\n📞 *Téléphone :* '+phone+'\n📱 *Appareil :* '+brand+' '+model+'\n🔧 *Problème :* '+type+'\n📝 *Détails :* '+desc+'\n📍 *Dépôt :* '+(dropoff==='boutique'?'En boutique':'Collecte à domicile')+'\n\n_Envoyé depuis TechShop CI_ 🙏';
  window.open('https://wa.me/'+waNumber.replace(/\D/g,'')+'?text='+encodeURIComponent(msg), '_blank');
  document.getElementById('repair-form').style.display = 'none';
  document.getElementById('form-success').style.display = 'block';
}

function resetForm() {
  document.getElementById('repair-form').reset();
  document.getElementById('repair-form').style.display = 'block';
  document.getElementById('form-success').style.display = 'none';
}

function subscribeNewsletter() {
  const email = document.getElementById('newsletter-email').value.trim();
  if (!email || !email.includes('@')) { alert('Entrez un email valide'); return; }
  alert('✅ Merci ! Vous êtes inscrit(e) à notre newsletter.');
  document.getElementById('newsletter-email').value = '';
}

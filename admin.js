// ================================================================
// TECHSHOP CI — admin.js  (USAGE EXCLUSIF PAGE ADMIN)
// Authentification : Supabase Auth (email + mot de passe)
// ================================================================

// ====== ⚠️  CONFIGURATION — À MODIFIER ======
const SUPABASE_URL     = 'https://VOTRE_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'VOTRE_ANON_KEY_ICI';

// ====== VARIABLES GLOBALES ======
let sb = null;
let currentUser = null;
let allProducts  = [];
let allRepairs   = [];
let currentCatFilter = 'phones';
let searchQuery = '';
let editingId = null;
let waNumber = '+2250710878025';

// ====== INITIALISATION ======
document.addEventListener('DOMContentLoaded', async () => {
  initSupabase();
  await checkSession();
});

function initSupabase() {
  if (window.supabase && !SUPABASE_URL.includes('VOTRE_PROJECT_ID')) {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
}

// ====== GESTION SESSION ======
async function checkSession() {
  if (!sb) {
    // Mode démo sans Supabase : utilise localStorage
    const savedUser = localStorage.getItem('ts_admin_demo');
    if (savedUser) {
      currentUser = JSON.parse(savedUser);
      showAdmin();
    } else {
      showLogin();
    }
    return;
  }
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (session) {
      currentUser = session.user;
      showAdmin();
    } else {
      showLogin();
    }
  } catch(e) {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-screen').style.display = 'none';
}

async function showAdmin() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-screen').style.display = 'block';
  if (currentUser) {
    document.getElementById('user-email').textContent = currentUser.email || 'Administrateur';
  }
  loadSettings();
  await Promise.all([loadProducts(), loadRepairs()]);
  updateStats();
  renderRecentProducts();
  renderProductsTable();
}

// ====== CONNEXION ======
async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pwd   = document.getElementById('login-pwd').value;
  const errEl = document.getElementById('login-error');
  const btnEl = document.getElementById('btn-login');
  errEl.style.display = 'none';

  if (!email || !pwd) {
    showLoginError('Veuillez remplir email et mot de passe.'); return;
  }
  btnEl.disabled = true;
  btnEl.textContent = 'Connexion en cours...';

  try {
    if (!sb) {
      // Mode démo — mot de passe local stocké ou "admin123" par défaut
      const storedPwd = localStorage.getItem('ts_admin_pwd') || 'admin123';
      const storedEmail = localStorage.getItem('ts_admin_email') || 'admin@techshop.ci';
      if (email === storedEmail && pwd === storedPwd) {
        currentUser = { email };
        localStorage.setItem('ts_admin_demo', JSON.stringify(currentUser));
        showAdmin();
      } else {
        showLoginError('Email ou mot de passe incorrect.');
      }
    } else {
      const { data, error } = await sb.auth.signInWithPassword({ email, password: pwd });
      if (error) throw error;
      currentUser = data.user;
      showAdmin();
    }
  } catch(e) {
    showLoginError(e.message || 'Email ou mot de passe incorrect.');
  } finally {
    btnEl.disabled = false;
    btnEl.textContent = 'Se connecter';
  }
}

function showLoginError(msg) {
  const el = document.getElementById('login-error');
  el.textContent = '⚠️ ' + msg;
  el.style.display = 'block';
}

async function doLogout() {
  if (sb) await sb.auth.signOut();
  localStorage.removeItem('ts_admin_demo');
  currentUser = null;
  showLogin();
  toast('Déconnexion réussie', 'success');
}

// ====== NAVIGATION SECTIONS ======
const sectionTitles = {
  dashboard:   ['Tableau de bord',       'Vue d\'ensemble de votre boutique'],
  products:    ['Gestion des Produits',   'Modifier, supprimer, gérer le stock'],
  'add-product':['Ajouter un Produit',   'Nouveau produit dans le catalogue'],
  repairs:     ['Demandes de Réparation', 'Gérer les demandes clients'],
  settings:    ['Paramètres',            'Configuration de la boutique'],
};

function showSection(name) {
  document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('sec-' + name)?.classList.add('active');
  const navItems = document.querySelectorAll('.nav-item');
  const sections = ['dashboard','products','add-product','repairs','settings'];
  const idx = sections.indexOf(name);
  if (idx >= 0) navItems[idx]?.classList.add('active');
  const [title, sub] = sectionTitles[name] || [name, ''];
  document.getElementById('section-title').textContent = title;
  document.getElementById('section-subtitle').textContent = sub;
}

// ====== CHARGEMENT DONNÉES ======
async function loadProducts() {
  try {
    if (sb) {
      const { data, error } = await sb.from('products').select('*').order('id');
      if (!error && data) { allProducts = data; return; }
    }
    const saved = localStorage.getItem('ts_products');
    allProducts = saved ? JSON.parse(saved) : [];
  } catch(e) { allProducts = []; }
}

async function loadRepairs() {
  try {
    if (sb) {
      const { data, error } = await sb.from('repairs').select('*').order('created_at', { ascending: false });
      if (!error && data) { allRepairs = data; return; }
    }
    const saved = localStorage.getItem('ts_repairs');
    allRepairs = saved ? JSON.parse(saved) : [];
  } catch(e) { allRepairs = []; }
}

// ====== STATS ======
function updateStats() {
  const set = (id, val) => { const el = document.getElementById(id); if(el) el.textContent = val; };
  set('s-phones',  allProducts.filter(p => p.cat === 'phones').length);
  set('s-acc',     allProducts.filter(p => p.cat === 'accessories').length);
  set('s-elec',    allProducts.filter(p => p.cat === 'electromenager').length);
  set('s-repairs', allRepairs.length);
}

// ====== PRODUITS RÉCENTS (dashboard) ======
function renderRecentProducts() {
  const c = document.getElementById('recent-products');
  if (!c) return;
  const recent = [...allProducts].sort((a,b) => b.id - a.id).slice(0, 5);
  if (!recent.length) { c.innerHTML = '<p style="color:var(--text-light);padding:20px 0">Aucun produit encore.</p>'; return; }
  c.innerHTML = '<table class="products-table"><thead><tr><th></th><th>Produit</th><th>Catégorie</th><th>Prix</th><th>Stock</th></tr></thead><tbody>' +
    recent.map(p => `
      <tr>
        <td>${p.image ? '<img class="prod-thumb" src="'+p.image+'" onerror="this.style.display=\'none\'">' : '<div class="prod-thumb-empty">📦</div>'}</td>
        <td><strong>${p.name}</strong><br><span style="color:var(--text-light);font-size:.8rem">${p.brand||''}</span></td>
        <td>${{phones:'📱 Téléphones',accessories:'🎧 Accessoires',electromenager:'🏠 Électroménager'}[p.cat]||p.cat}</td>
        <td><strong style="color:var(--orange)">${fmtPrice(p.price)}</strong></td>
        <td><span class="badge ${p.available!==false?'badge-in':'badge-out'}">${p.available!==false?'En stock':'Rupture'}</span></td>
      </tr>
    `).join('') +
  '</tbody></table>';
}

// ====== TABLE PRODUITS ======
function filterTab(cat, el) {
  currentCatFilter = cat;
  document.querySelectorAll('#sec-products .tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  renderProductsTable();
}

function filterTable(q) {
  searchQuery = q.toLowerCase();
  renderProductsTable();
}

function renderProductsTable() {
  const c = document.getElementById('products-table-wrap');
  if (!c) return;
  let list = allProducts;
  if (currentCatFilter !== 'all') list = list.filter(p => p.cat === currentCatFilter);
  if (searchQuery) list = list.filter(p => (p.name+' '+(p.brand||'')+(p.description||'')).toLowerCase().includes(searchQuery));
  if (!list.length) {
    c.innerHTML = '<p style="color:var(--text-light);padding:24px 0;text-align:center">Aucun produit trouvé.</p>'; return;
  }
  c.innerHTML = '<table class="products-table"><thead><tr><th></th><th>Produit</th><th>Prix</th><th>Stock</th><th>Actions</th></tr></thead><tbody>' +
    list.map(p => `
      <tr>
        <td>${p.image ? '<img class="prod-thumb" src="'+p.image+'" onerror="this.style.display=\'none\'">' : '<div class="prod-thumb-empty">📦</div>'}</td>
        <td>
          <strong>${p.name}</strong>
          <br><span style="color:var(--text-light);font-size:.8rem">${p.brand||''} · ${{phones:'Téléphones',accessories:'Accessoires',electromenager:'Électroménager'}[p.cat]||''}</span>
        </td>
        <td><strong style="color:var(--orange)">${fmtPrice(p.price)}</strong></td>
        <td><span class="badge ${p.available!==false?'badge-in':'badge-out'}">${p.available!==false?'En stock':'Rupture'}</span></td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-sm" onclick="editProduct(${p.id})">✏️ Modifier</button>
            <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('') +
  '</tbody></table>';
}

// ====== FORMULAIRE PRODUIT ======
function previewImg(url) {
  const el = document.getElementById('img-preview');
  if (!el) return;
  if (url && url.startsWith('http')) {
    el.innerHTML = '<img src="'+url+'" onerror="this.parentNode.innerHTML=\'Lien invalide\'">';
  } else {
    el.textContent = 'Cliquer pour image';
  }
}

async function handleImgFile(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const el = document.getElementById('img-preview');
    if (el) el.innerHTML = '<img src="'+e.target.result+'">';
    document.getElementById('f-image-url').value = '';
  };
  reader.readAsDataURL(file);
}

function editProduct(id) {
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  document.getElementById('form-title').textContent = 'Modifier le produit';
  document.getElementById('edit-id').value = id;
  document.getElementById('f-name').value = p.name || '';
  document.getElementById('f-cat').value = p.cat || 'phones';
  document.getElementById('f-price').value = p.price || '';
  document.getElementById('f-brand').value = p.brand || '';
  document.getElementById('f-available').value = String(p.available !== false);
  document.getElementById('f-image-url').value = (p.image && !p.image.startsWith('data:')) ? p.image : '';
  document.getElementById('f-desc').value = p.description || p.desc || '';
  const prev = document.getElementById('img-preview');
  if (prev && p.image) prev.innerHTML = '<img src="'+p.image+'">';
  showSection('add-product');
}

async function saveProduct() {
  const name     = document.getElementById('f-name').value.trim();
  const cat      = document.getElementById('f-cat').value;
  const price    = parseInt(document.getElementById('f-price').value);
  const brand    = document.getElementById('f-brand').value.trim();
  const available= document.getElementById('f-available').value === 'true';
  const imgUrl   = document.getElementById('f-image-url').value.trim();
  const imgFile  = document.getElementById('f-image-file').files[0];
  const desc     = document.getElementById('f-desc').value.trim();
  const statusEl = document.getElementById('save-status');

  if (!name || !cat || !price) { toast('Nom, catégorie et prix sont obligatoires', 'error'); return; }

  statusEl.textContent = '⏳ Enregistrement...';

  // Lire l'image fichier si présente
  let image = imgUrl;
  if (imgFile) {
    image = await new Promise(resolve => {
      const r = new FileReader();
      r.onload = e => resolve(e.target.result);
      r.readAsDataURL(imgFile);
    });
  } else if (!image) {
    // Conserver l'image existante lors d'une modification
    const existing = allProducts.find(p => p.id === editingId);
    if (existing) image = existing.image || '';
  }

  const productData = { name, cat, price, brand, available, image, description: desc };

  try {
    if (sb) {
      if (editingId) {
        const { error } = await sb.from('products').update(productData).eq('id', editingId);
        if (error) throw error;
        const idx = allProducts.findIndex(p => p.id === editingId);
        if (idx !== -1) allProducts[idx] = { ...allProducts[idx], ...productData };
      } else {
        const { data, error } = await sb.from('products').insert([productData]).select();
        if (error) throw error;
        if (data) allProducts.push(data[0]);
      }
    } else {
      // Mode localStorage
      if (editingId) {
        const idx = allProducts.findIndex(p => p.id === editingId);
        if (idx !== -1) allProducts[idx] = { ...allProducts[idx], ...productData };
      } else {
        const newId = Math.max(0, ...allProducts.map(p => p.id)) + 1;
        allProducts.push({ id: newId, ...productData });
      }
      localStorage.setItem('ts_products', JSON.stringify(allProducts));
    }
    toast(editingId ? 'Produit modifié ✅' : 'Produit ajouté ✅', 'success');
    updateStats();
    renderRecentProducts();
    renderProductsTable();
    clearForm();
    showSection('products');
  } catch(e) {
    toast('Erreur : ' + (e.message || e), 'error');
    statusEl.textContent = '';
  }
}

async function deleteProduct(id) {
  if (!confirm('Supprimer ce produit définitivement ?')) return;
  try {
    if (sb) {
      const { error } = await sb.from('products').delete().eq('id', id);
      if (error) throw error;
    }
    allProducts = allProducts.filter(p => p.id !== id);
    if (!sb) localStorage.setItem('ts_products', JSON.stringify(allProducts));
    toast('Produit supprimé', 'success');
    updateStats();
    renderRecentProducts();
    renderProductsTable();
  } catch(e) {
    toast('Erreur suppression : ' + (e.message || e), 'error');
  }
}

function clearForm() {
  editingId = null;
  document.getElementById('form-title').textContent = 'Ajouter un produit';
  document.getElementById('edit-id').value = '';
  ['f-name','f-price','f-brand','f-image-url','f-desc'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('f-cat').value = 'phones';
  document.getElementById('f-available').value = 'true';
  const prev = document.getElementById('img-preview');
  if (prev) prev.innerHTML = 'Cliquer pour image';
  // Reset file input
  const fi = document.getElementById('f-image-file');
  if (fi) { const ni = fi.cloneNode(true); ni.onchange = e => handleImgFile(e.target); fi.parentNode.replaceChild(ni, fi); }
  document.getElementById('save-status').textContent = '';
}

// ====== RÉPARATIONS ======
function renderRepairs() {
  const c = document.getElementById('repairs-list');
  if (!c) return;
  if (!allRepairs.length) {
    c.innerHTML = '<p style="color:var(--text-light);padding:20px 0;text-align:center">Aucune demande de réparation reçue.</p>'; return;
  }
  c.innerHTML = allRepairs.map(r => `
    <div class="repair-card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px">
        <h4>🔧 ${r.brand || ''} ${r.model || ''}</h4>
        <span style="font-size:.78rem;color:var(--text-light)">${new Date(r.created_at||Date.now()).toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
      </div>
      <div class="repair-meta">
        <span>👤 ${r.name||'—'}</span>
        <span>📞 ${r.phone||'—'}</span>
        <span>🔧 ${r.type||'—'}</span>
        <span>📍 ${r.dropoff==='boutique'?'Dépôt en boutique':'Collecte domicile'}</span>
      </div>
      <div class="repair-desc">${r.description||r.desc||'—'}</div>
      <div class="repair-actions">
        <a href="https://wa.me/${(r.phone||'').replace(/\D/g,'')}" target="_blank" class="btn btn-primary btn-sm">💬 Contacter sur WhatsApp</a>
        <button class="btn btn-danger btn-sm" onclick="deleteRepair(${r.id||'\''+r.phone+'\''})">🗑️ Supprimer</button>
      </div>
    </div>
  `).join('');
}

async function deleteRepair(id) {
  if (!confirm('Supprimer cette demande ?')) return;
  try {
    if (sb) {
      await sb.from('repairs').delete().eq('id', id);
    }
    allRepairs = allRepairs.filter(r => r.id !== id);
    if (!sb) localStorage.setItem('ts_repairs', JSON.stringify(allRepairs));
    toast('Demande supprimée', 'success');
    updateStats();
    renderRepairs();
  } catch(e) { toast('Erreur : ' + e.message, 'error'); }
}

// Override showSection pour charger les réparations au besoin
const _origShow = showSection;
window.showSection = function(name) {
  _origShow(name);
  if (name === 'repairs') renderRepairs();
};

// ====== PARAMÈTRES ======
function loadSettings() {
  const wa = localStorage.getItem('ts_wa') || '+2250710878025';
  waNumber = wa;
  const el = document.getElementById('wa-number');
  if (el) el.value = wa;
  ['shop-name','shop-addr','shop-hours','shop-email'].forEach(k => {
    const el = document.getElementById('s-' + k);
    const val = localStorage.getItem('ts_' + k.replace('-','_'));
    if (el && val) el.value = val;
  });
}

function saveWA() {
  const num = document.getElementById('wa-number')?.value.trim();
  if (!num) { toast('Numéro invalide', 'error'); return; }
  waNumber = num;
  localStorage.setItem('ts_wa', num);
  toast('Numéro WhatsApp enregistré ✅', 'success');
}

function saveShopInfo() {
  const fields = ['shop-name','shop-addr','shop-hours','shop-email'];
  fields.forEach(k => {
    const el = document.getElementById('s-' + k);
    if (el && el.value.trim()) localStorage.setItem('ts_' + k.replace('-','_'), el.value.trim());
  });
  toast('Informations enregistrées ✅', 'success');
}

async function changePwd() {
  const newPwd  = document.getElementById('new-pwd')?.value;
  const confirm = document.getElementById('confirm-pwd')?.value;
  if (!newPwd || newPwd.length < 6) { toast('Mot de passe trop court (6 min)', 'error'); return; }
  if (newPwd !== confirm) { toast('Les mots de passe ne correspondent pas', 'error'); return; }
  try {
    if (sb) {
      const { error } = await sb.auth.updateUser({ password: newPwd });
      if (error) throw error;
    } else {
      localStorage.setItem('ts_admin_pwd', newPwd);
    }
    toast('Mot de passe mis à jour ✅', 'success');
    document.getElementById('new-pwd').value = '';
    document.getElementById('confirm-pwd').value = '';
  } catch(e) { toast('Erreur : ' + e.message, 'error'); }
}

async function checkDB() {
  const el = document.getElementById('db-status');
  if (!el) return;
  if (!sb) {
    el.style.background = '#fef3c7';
    el.style.color = '#92400e';
    el.innerHTML = '⚠️ <strong>Mode démo</strong> — Supabase non configuré. Les données sont sauvegardées en local (localStorage) sur votre navigateur.';
    return;
  }
  el.textContent = '⏳ Test en cours...';
  try {
    const { data, error } = await sb.from('products').select('id').limit(1);
    if (error) throw error;
    el.style.background = '#c6f6d5';
    el.style.color = '#276749';
    el.innerHTML = '✅ <strong>Connexion Supabase réussie</strong> — Base de données en ligne.';
  } catch(e) {
    el.style.background = '#fed7d7';
    el.style.color = '#c53030';
    el.innerHTML = '❌ <strong>Erreur de connexion</strong> — ' + e.message;
  }
}

// ====== UTILITAIRES ======
function fmtPrice(p) { return Number(p).toLocaleString('fr-FR') + ' FCFA'; }

function toast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = (type === 'success' ? '✅ ' : '❌ ') + msg;
  el.className = 'toast ' + type + ' show';
  setTimeout(() => el.classList.remove('show'), 3500);
}

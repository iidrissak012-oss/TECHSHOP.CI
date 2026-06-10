-- ================================================================
-- TECHSHOP CI — Script de création de la base de données Supabase
-- Copiez-collez ce script dans : Supabase → SQL Editor → Run
-- ================================================================

-- ====== TABLE : PRODUITS ======
CREATE TABLE IF NOT EXISTS products (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  cat         TEXT NOT NULL CHECK (cat IN ('phones', 'accessories', 'electromenager')),
  price       INTEGER NOT NULL,
  brand       TEXT,
  image       TEXT,
  description TEXT,
  available   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ====== TABLE : DEMANDES DE RÉPARATION ======
CREATE TABLE IF NOT EXISTS repairs (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  brand       TEXT,
  model       TEXT,
  type        TEXT,
  description TEXT,
  dropoff     TEXT DEFAULT 'boutique',
  status      TEXT DEFAULT 'nouveau' CHECK (status IN ('nouveau', 'en_cours', 'termine', 'annule')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ====== TABLE : PARAMÈTRES ======
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====== MISE À JOUR AUTOMATIQUE updated_at ======
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated ON products;
CREATE TRIGGER trg_products_updated
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ====== SÉCURITÉ RLS (Row Level Security) ======
-- Activer RLS sur toutes les tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE repairs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- PRODUITS : lecture publique (site client), écriture admin seulement
CREATE POLICY "produits_lecture_publique"
  ON products FOR SELECT USING (true);

CREATE POLICY "produits_ecriture_admin"
  ON products FOR ALL
  USING (auth.role() = 'authenticated');

-- RÉPARATIONS : insertion publique (formulaire client), lecture/suppression admin
CREATE POLICY "reparations_insertion_publique"
  ON repairs FOR INSERT WITH CHECK (true);

CREATE POLICY "reparations_gestion_admin"
  ON repairs FOR ALL
  USING (auth.role() = 'authenticated');

-- PARAMÈTRES : lecture publique, écriture admin
CREATE POLICY "settings_lecture_publique"
  ON settings FOR SELECT USING (true);

CREATE POLICY "settings_ecriture_admin"
  ON settings FOR ALL
  USING (auth.role() = 'authenticated');

-- ====== DONNÉES INITIALES ======
INSERT INTO products (name, cat, price, brand, image, description, available) VALUES
('iPhone 15 Pro Max',        'phones',        750000, 'Apple',     'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=900&q=80', '256GB, Titanium, 48MP ProRAW, puce A17 Pro', true),
('iPhone 14',                'phones',        450000, 'Apple',     'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80', '128GB, Super Retina XDR, A15 Bionic', true),
('Samsung Galaxy S24 Ultra', 'phones',        620000, 'Samsung',   'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=900&q=80', '256GB, S-Pen inclus, 200MP, IA intégrée', true),
('Samsung Galaxy A54',       'phones',        180000, 'Samsung',   'https://images.unsplash.com/photo-1567581935884-3349723552ca?auto=format&fit=crop&w=900&q=80', '128GB, AMOLED 6.4", 50MP, 5000mAh', true),
('Tecno Camon 20 Pro',       'phones',        145000, 'Tecno',     'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=900&q=80', '256GB, 64MP RGBW, charge 45W, AMOLED', true),
('Infinix Note 40 Pro',      'phones',        120000, 'Infinix',   'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?auto=format&fit=crop&w=900&q=80', '256GB, 108MP, charge 45W, 6.78"', true),
('Xiaomi Redmi Note 13 Pro', 'phones',        135000, 'Xiaomi',    'https://images.unsplash.com/photo-1523206489230-c012c64b2b48?auto=format&fit=crop&w=900&q=80', '256GB, 200MP, AMOLED 120Hz, 67W', true),
('Oppo Reno 11',             'phones',        210000, 'Oppo',      'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=900&q=80', '256GB, 50MP Sony, 80W SuperVOOC', true),
('AirPods Pro 2e Génération','accessories',    35000, 'Apple',     'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?auto=format&fit=crop&w=900&q=80', 'Réduction de bruit active, Bluetooth 5.3', true),
('Samsung Buds2 Pro',        'accessories',    22000, 'Samsung',   'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=80', 'ANC Pro, 29h autonomie totale', true),
('Chargeur Rapide 65W',      'accessories',     8500, 'Baseus',    'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=900&q=80', 'Charge rapide 65W, compatible tous téléphones', true),
('Powerbank 20000mAh',       'accessories',    15000, 'Anker',     'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&w=900&q=80', '20000mAh, 2 ports USB, charge rapide 22.5W', true),
('TV LED 55" 4K Smart',      'electromenager',320000, 'Hisense',   'https://images.unsplash.com/photo-1593305841991-05c297ba4575?auto=format&fit=crop&w=900&q=80', 'Dolby Atmos, Android TV, Wi-Fi, Bluetooth', true),
('TV LED 43" Full HD Smart', 'electromenager',185000, 'Samsung',   'https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&w=900&q=80', 'Tizen OS, HDR, ports HDMI x2', true),
('Climatiseur 1.5CV',        'electromenager',280000, 'LG',        'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=80', 'Inverter, classe A++, WiFi, télécommande', true),
('Réfrigérateur NoFrost 300L','electromenager',350000,'Samsung',   'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=900&q=80', 'NoFrost, distributeur eau, A+', true),
('Machine à Laver 7kg',      'electromenager',210000, 'LG',        'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?auto=format&fit=crop&w=900&q=80', 'Lave-linge frontal, 1400 tr/min, vapeur', true),
('Micro-ondes 25L Digital',  'electromenager', 55000, 'Hisense',   'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?auto=format&fit=crop&w=900&q=80', '25L, 900W, fonction grill, digital', true)
ON CONFLICT DO NOTHING;

-- ====== VÉRIFICATION ======
SELECT 'Base de données créée avec succès ! 🎉' AS message;
SELECT COUNT(*) AS nb_produits FROM products;

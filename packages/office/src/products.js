/**
 * @file packages/office/src/products.js
 * Product Matrix & Service Catalog for @tidy/office
 */

const crypto = require('crypto');
const { getDb } = require('./core-bridge');
const { initOfficeSchema } = require('./schema');

function generateId(prefix = 'prod') {
  return `${prefix}_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
}

function ensureSchema() {
  const db = getDb();
  initOfficeSchema(db);
  return db;
}

function addProduct({
  name,
  sku = null,
  category = 'service',
  unitPrice = 0,
  currency = 'USD',
  billingCycle = 'one_time',
  description = null
}) {
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new Error('Product name is required.');
  }

  const db = ensureSchema();
  const id = generateId('prod');
  const cleanSku = sku ? sku.trim() : `SKU-${Date.now().toString(36).toUpperCase()}`;
  const validCycles = ['one_time', 'monthly', 'quarterly', 'yearly'];
  const cleanCycle = validCycles.includes(billingCycle) ? billingCycle : 'one_time';

  const stmt = db.prepare(`
    INSERT INTO app_products (
      id, name, sku, category, unit_price, currency, billing_cycle, description, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `);

  stmt.run(
    id,
    name.trim(),
    cleanSku,
    category || 'service',
    Number(unitPrice) || 0,
    currency || 'USD',
    cleanCycle,
    description ? description.trim() : null
  );

  return getProduct(id);
}

function getProduct(id) {
  if (!id) return null;
  const db = ensureSchema();
  return db.prepare('SELECT * FROM app_products WHERE id = ?').get(id) || null;
}

function listProducts({ category = null, activeOnly = true } = {}) {
  const db = ensureSchema();
  let sql = 'SELECT * FROM app_products WHERE 1=1';
  const params = [];

  if (activeOnly) {
    sql += ' AND is_active = 1';
  }
  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }

  sql += ' ORDER BY name ASC';
  return db.prepare(sql).all(...params);
}

function updateProduct(id, updates = {}) {
  if (!id) throw new Error('Product ID is required.');
  const db = ensureSchema();
  const existing = getProduct(id);
  if (!existing) return null;

  const newName = updates.name !== undefined ? updates.name.trim() : existing.name;
  const newSku = updates.sku !== undefined ? updates.sku.trim() : existing.sku;
  const newCategory = updates.category !== undefined ? updates.category : existing.category;
  const newPrice = updates.unitPrice !== undefined ? Number(updates.unitPrice) : existing.unit_price;
  const newCurrency = updates.currency || existing.currency;
  const newCycle = updates.billingCycle || existing.billing_cycle;
  const newDesc = updates.description !== undefined ? updates.description : existing.description;
  const newActive = updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : existing.is_active;

  db.prepare(`
    UPDATE app_products
    SET name = ?, sku = ?, category = ?, unit_price = ?, currency = ?, billing_cycle = ?, description = ?, is_active = ?
    WHERE id = ?
  `).run(newName, newSku, newCategory, newPrice, newCurrency, newCycle, newDesc, newActive, id);

  return getProduct(id);
}

function deleteProduct(id) {
  if (!id) return false;
  const db = ensureSchema();
  const res = db.prepare('DELETE FROM app_products WHERE id = ?').run(id);
  return res.changes > 0;
}

module.exports = {
  addProduct,
  getProduct,
  listProducts,
  updateProduct,
  deleteProduct
};

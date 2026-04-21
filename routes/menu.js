const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  const { admin } = req.query;
  try {
    let query = 'SELECT * FROM menu_items WHERE is_available = true AND in_stock = true';
    if (admin === 'true') {
      query = 'SELECT * FROM menu_items WHERE is_available = true ORDER BY category, name';
    }
    const result = await db.query(query);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:category', async (req, res) => {
  const { admin } = req.query;
  try {
    let query = 'SELECT * FROM menu_items WHERE category = $1 AND is_available = true AND in_stock = true';
    if (admin === 'true') {
      query = 'SELECT * FROM menu_items WHERE category = $1 AND is_available = true ORDER BY name';
    }
    const result = await db.query(query, [req.params.category]);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const { name, description, price, category, is_veg, image_url } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO menu_items (name, description, price, category, is_veg, image_url) VALUES ($1,$2,$3,$4,$5,$6) RETURNING item_id',
      [name, description, price, category, is_veg, image_url || '']
    );
    res.json({ message: 'Item added!', itemId: result.rows[0].item_id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    // Attempt hard delete
    try {
      const result = await db.query('DELETE FROM menu_items WHERE item_id = $1 RETURNING item_id', [req.params.id]);
      if (result.rowCount > 0) {
        return res.json({ message: 'Item permanently deleted from catalog!' });
      }
    } catch (dbErr) {
      // If referenced by orders, fall back to hard-hide (soft delete)
      if (dbErr.code === '23503') { // Foreign key violation
        await db.query('UPDATE menu_items SET is_available = false, in_stock = false WHERE item_id = $1', [req.params.id]);
        return res.json({ message: 'Item is linked to past orders. It has been permanently hidden from selection.' });
      }
      throw dbErr;
    }
    res.status(404).json({ error: 'Item not found' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Toggle sold-out (is_available) - hides item from student menu when sold out
router.put('/:id/toggle-stock', async (req, res) => {
  try {
    await db.query('UPDATE menu_items SET in_stock = NOT in_stock WHERE item_id = $1', [req.params.id]);
    res.json({ message: 'Stock status updated!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/image', async (req, res) => {
  const { image_url } = req.body;
  try {
    await db.query('UPDATE menu_items SET image_url = $1 WHERE item_id = $2', [image_url, req.params.id]);
    res.json({ message: 'Image updated!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

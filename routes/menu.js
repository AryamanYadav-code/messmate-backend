 const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Get all menu items
router.get('/', (req, res) => {
  db.query('SELECT * FROM menu_items WHERE is_available = 1', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Get menu by category
router.get('/:category', (req, res) => {
  db.query('SELECT * FROM menu_items WHERE category = ? AND is_available = 1',
    [req.params.category], (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
});

// Admin - Add menu item
router.post('/', (req, res) => {
  const { name, description, price, category, is_veg, image_url } = req.body;
  db.query(
    'INSERT INTO menu_items (name, description, price, category, is_veg, image_url) VALUES (?,?,?,?,?,?)',
    [name, description, price, category, is_veg, image_url],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Item added!', itemId: result.insertId });
    }
  );
});

// Admin - Delete menu item
router.delete('/:id', (req, res) => {
  db.query('UPDATE menu_items SET is_available = 0 WHERE item_id = ?',
    [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Item removed!' });
    });
});

// Update item image
router.put('/:id/image', (req, res) => {
  const { image_url } = req.body;
  db.query('UPDATE menu_items SET image_url = ? WHERE item_id = ?',
    [image_url, req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Image updated!' });
    });
});

module.exports = router;

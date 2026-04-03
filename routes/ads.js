const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', (req, res) => {
  db.query('SELECT * FROM ads WHERE is_approved = 1', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

router.get('/all', (req, res) => {
  db.query('SELECT * FROM ads ORDER BY created_at DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

router.post('/', (req, res) => {
  const { title, image_url, link_url } = req.body;
  db.query('INSERT INTO ads (title, image_url, link_url, is_approved) VALUES (?,?,?,1)',
    [title, image_url, link_url || ''], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Ad added!', adId: result.insertId });
    });
});

router.delete('/:id', (req, res) => {
  db.query('DELETE FROM ads WHERE ad_id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Ad removed!' });
  });
});

router.put('/:id/toggle', (req, res) => {
  db.query('UPDATE ads SET is_approved = NOT is_approved WHERE ad_id = ?',
    [req.params.id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Ad toggled!' });
    });
});

module.exports = router;

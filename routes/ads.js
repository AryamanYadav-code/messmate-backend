const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM ads WHERE is_approved = true');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/all', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM ads ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const { title, image_url, link_url } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO ads (title, image_url, link_url, is_approved) VALUES ($1,$2,$3,true) RETURNING ad_id',
      [title, image_url, link_url || '']
    );
    res.json({ message: 'Ad added!', adId: result.rows[0].ad_id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM ads WHERE ad_id = $1', [req.params.id]);
    res.json({ message: 'Ad removed!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id/toggle', async (req, res) => {
  try {
    await db.query('UPDATE ads SET is_approved = NOT is_approved WHERE ad_id = $1', [req.params.id]);
    res.json({ message: 'Ad toggled!' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

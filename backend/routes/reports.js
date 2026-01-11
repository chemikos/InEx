const express = require('express');
const router = express.Router();
const reportsService = require('../services/reportsService');

router.get('/daily-average', async (req, res) => {
  try {
    const { profileId } = req.query;

    const result = await reportsService.getDailyAverage({
      profileId: Number(profileId),
    });

    res.json(result);
  } catch (err) {
    res.status(400).json({
      message: err.message || 'Błąd pobierania danych raportu',
    });
  }
});

router.get('/balance', async (req, res) => {
  try {
    const profileId = Number(req.query.profileId);

    const result = await reportsService.getBalance({ profileId });

    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/expenses/categories', async (req, res) => {
  try {
    const profileId = Number(req.query.profileId);

    const result = await reportsService.getExpensesByCategory(profileId);

    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/expenses/labels', async (req, res) => {
  try {
    const profileId = Number(req.query.profileId);

    const result = await reportsService.getExpensesByLabel(profileId);

    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/expenses/items', async (req, res) => {
  try {
    const profileId = Number(req.query.profileId);

    const result = await reportsService.getExpensesByItem(profileId);

    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;

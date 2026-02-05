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

    const result = await reportsService.getBalance(profileId);

    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

router.get('/expenses', async (req, res) => {
  try {
    const profileId = Number(req.query.profileId);

    // const categories = await reportsService.getExpensesByCategory(profileId);
    // const labels = await reportsService.getExpensesByLabel(profileId);
    // const items = await reportsService.getExpensesByItem(profileId);

    // const itemsInCategories = await reportsService.getItemsInCategories(profileId);

    res.json({
      categories: await reportsService.getExpensesByCategory(profileId),
      labels: await reportsService.getExpensesByLabel(profileId),
      items: await reportsService.getExpensesByItem(profileId),
      // itemsInCategories: await reportsService.getItemsInCategories(profileId),
      summary: await reportsService.getBalance(profileId),
    });
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

router.get('/expenses/:categoryId/items', async (req, res) => {
  try {
    const profileId = Number(req.query.profileId);
    const categoryId = Number(req.params.categoryId);
    const period = req.query.period;

    const result = await reportsService.getExpensesByItemAndCategory(profileId, categoryId, period);

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

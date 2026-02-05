const fs = require('fs');
const path = require('path');
const db = require('../database');

const dailyAverageSql = fs.readFileSync(
  path.join(__dirname, '../sql/reports/dailyAverage.sql'),
  'utf8'
);

const balanceSql = fs.readFileSync(
  path.join(__dirname, '../sql/reports/balance/balance.sql'),
  'utf8'
);

const balanceMonthlySql = fs.readFileSync(
  path.join(__dirname, '../sql/reports/balance/monthly.sql'),
  'utf8'
);

const balanceYearlySql = fs.readFileSync(
  path.join(__dirname, '../sql/reports/balance/yearly.sql'),
  'utf8'
);

const balanceTotalSql = fs.readFileSync(
  path.join(__dirname, '../sql/reports/balance/total.sql'),
  'utf8'
);

// const balanceYearlySql = fs.readFileSync(
//   path.join(__dirname, '../sql/reports/balanceYearly.sql'),
//   'utf8'
// );

// const balanceTotalSql = fs.readFileSync(
//   path.join(__dirname, '../sql/reports/balanceTotal.sql'),
//   'utf8'
// );

const categoryMonthlySql = fs.readFileSync(
  path.join(__dirname, '../sql/reports/expenses/monthly/category.sql'),
  'utf8'
);
const labelMonthlySql = fs.readFileSync(
  path.join(__dirname, '../sql/reports/expenses/monthly/label.sql'),
  'utf8'
);
const itemMonthlySql = fs.readFileSync(
  path.join(__dirname, '../sql/reports/expenses/monthly/item.sql'),
  'utf8'
);

const categoryYearlySql = fs.readFileSync(
  path.join(__dirname, '../sql/reports/expenses/yearly/category.sql'),
  'utf8'
);
const labelYearlySql = fs.readFileSync(
  path.join(__dirname, '../sql/reports/expenses/yearly/label.sql'),
  'utf8'
);
const itemYearlySql = fs.readFileSync(
  path.join(__dirname, '../sql/reports/expenses/yearly/item.sql'),
  'utf8'
);

const categoryTotalSql = fs.readFileSync(
  path.join(__dirname, '../sql/reports/expenses/total/category.sql'),
  'utf8'
);
const labelTotalSql = fs.readFileSync(
  path.join(__dirname, '../sql/reports/expenses/total/label.sql'),
  'utf8'
);
const itemTotalSql = fs.readFileSync(
  path.join(__dirname, '../sql/reports/expenses/total/item.sql'),
  'utf8'
);

const itemsInCategoriesSql = fs.readFileSync(
  path.join(__dirname, '../sql/reports/expenses/itemsInCategories.sql'),
  'utf8'
);

const itemsByCategoryMonthSql = fs.readFileSync(
  path.join(__dirname, '../sql/reports/expenses/monthly/itemsByCategory.sql'),
  'utf8'
);

const itemsByCategoryYearSql = fs.readFileSync(
  path.join(__dirname, '../sql/reports/expenses/yearly/itemsByCategory.sql'),
  'utf8'
);

const itemsByCategoryTotalSql = fs.readFileSync(
  path.join(__dirname, '../sql/reports/expenses/total/itemsByCategory.sql'),
  'utf8'
);

// --- Functions ---

async function getDailyAverage({ profileId }) {
  if (!profileId) {
    throw new Error('profileId jest wymagane');
  }

  const rows = await db.allPromise(dailyAverageSql, {
    ':profileId': profileId,
  });

  return {
    profileId,
    data: rows.map((row) => ({
      date: row.date,
      historicalAverage: row.historical_average,
      monthlyAverage: row.monthly_average,
    })),
  };
}

async function getBalance(profileId) {
  if (!profileId) {
    throw new Error('profileId jest wymagane');
  }
  return {
    month: await db.allPromise(balanceMonthlySql, [profileId, profileId]),
    year: await db.allPromise(balanceYearlySql, [profileId, profileId]),
    total: await db.allPromise(balanceTotalSql, [profileId, profileId]),
  };
}

async function getExpensesByCategory(profileId) {
  return {
    month: await db.allPromise(categoryMonthlySql, [profileId]),
    year: await db.allPromise(categoryYearlySql, [profileId]),
    total: await db.allPromise(categoryTotalSql, [profileId]),
  };
}

async function getExpensesByLabel(profileId) {
  return {
    month: await db.allPromise(labelMonthlySql, [profileId]),
    year: await db.allPromise(labelYearlySql, [profileId]),
    total: await db.allPromise(labelTotalSql, [profileId]),
  };
}

async function getExpensesByItem(profileId) {
  return {
    month: await db.allPromise(itemMonthlySql, [profileId]),
    year: await db.allPromise(itemYearlySql, [profileId]),
    total: await db.allPromise(itemTotalSql, [profileId]),
  };
}

async function getItemsInCategories(profileId) {
  const resultItems = await db.allPromise(itemsInCategoriesSql, [profileId]);
  const itemsInCategories = resultItems.map((item) => {
    return {
      ...item,
      // Konwersja stringa etykiet na tablicę stringów
      item_names: item.item_names ? item.item_names.split(',') : [],
      // Konwersja stringa ID etykiet na tablicę liczb
      item_ids: item.item_ids ? item.item_ids.split(',').map((id) => parseInt(id)) : [],
    };
  });
  return [...itemsInCategories];
}

async function getExpensesByItemAndCategory(profileId, categoryId, period) {
  if (period === 'total')
    return await db.allPromise(itemsByCategoryTotalSql, [profileId, categoryId]);
  if (period.match(/^\d{4}$/))
    return await db.allPromise(itemsByCategoryYearSql, [period, profileId, categoryId]);
  if (period.match(/^\d{4}-\d{2}$/))
    return await db.allPromise(itemsByCategoryMonthSql, [period, profileId, categoryId]);
  throw new Error('Nieprawidłowy typ okresu');
}

module.exports = {
  getDailyAverage,
  getBalance,
  getExpensesByCategory,
  getExpensesByLabel,
  getExpensesByItem,
  getItemsInCategories,
  getExpensesByItemAndCategory,
};

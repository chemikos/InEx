const fs = require('fs');
const path = require('path');
const db = require('../database');

const dailyAverageSql = fs.readFileSync(
  path.join(__dirname, '../sql/reports/dailyAverage.sql'),
  'utf8'
);

const balanceSql = fs.readFileSync(path.join(__dirname, '../sql/reports/balance.sql'), 'utf8');

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
      monthyAverage: row.monthly_average,
    })),
  };
}

async function getBalance({ profileId }) {
  if (!profileId) {
    throw new Error('profileId jest wymagane');
  }

  const rows = await db.allPromise(balanceSql, {
    ':profileId': profileId,
  });

  return {
    profileId,
    data: rows,
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

module.exports = {
  getDailyAverage,
  getBalance,
  getExpensesByCategory,
  getExpensesByLabel,
  getExpensesByItem,
};

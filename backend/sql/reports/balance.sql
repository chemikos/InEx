WITH monthly_expenses AS (
  SELECT
    strftime('%Y-%m', date) AS period,
    SUM(amount) AS expense
  FROM expenses
  WHERE fk_profile = :profileId
  GROUP BY period
),
monthly_incomes AS (
  SELECT
    strftime('%Y-%m', date) AS period,
    SUM(amount) AS income
  FROM incomes
  WHERE fk_profile = :profileId
  GROUP BY period
),
merged AS (
  SELECT period, income, 0 AS expense FROM monthly_incomes
  UNION ALL
  SELECT period, 0 AS income, expense FROM monthly_expenses
),
monthly AS (
  SELECT
    period,
    SUM(income) AS income,
    SUM(expense) AS expense
  FROM merged
  GROUP BY period
),
monthly_with_balance AS (
  SELECT
    'month' AS period_type,
    period,
    income,
    expense,
    income - expense AS balance,
    SUM(income - expense) OVER (
      ORDER BY period
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS cumulative_balance,
    1 AS sort_order
  FROM monthly
),
yearly AS (
  SELECT
    'year' AS period_type,
    substr(period, 1, 4) AS period,
    SUM(income) AS income,
    SUM(expense) AS expense,
    SUM(income - expense) AS balance,
    NULL AS cumulative_balance,
    2 AS sort_order
  FROM monthly
  GROUP BY substr(period, 1, 4)
),
total AS (
  SELECT
    'total' AS period_type,
    'TOTAL' AS period,
    SUM(income) AS income,
    SUM(expense) AS expense,
    SUM(income - expense) AS balance,
    NULL AS cumulative_balance,
    3 AS sort_order
  FROM monthly
)
SELECT
  period_type,
  period,
  income,
  expense,
  balance,
  cumulative_balance
FROM (
  SELECT * FROM monthly_with_balance
  UNION ALL
  SELECT * FROM yearly
  UNION ALL
  SELECT * FROM total
)
ORDER BY sort_order, period;


WITH monthly_expenses AS (
  SELECT
    strftime('%Y-%m', date) AS period,
    SUM(amount) AS expense
  FROM expenses
  WHERE fk_profile = ?
  GROUP BY period
),
monthly_incomes AS (
  SELECT
    strftime('%Y-%m', date) AS period,
    SUM(amount) AS income
  FROM incomes
  WHERE fk_profile = ?
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
)
SELECT
    period,
    income,
    expense,
    (income - expense) AS balance,
    SUM(income - expense) OVER (
      ORDER BY period
      ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS cumulative_balance
FROM monthly
ORDER BY period;
  WITH total_expenses AS (
  SELECT
    'TOTAL' AS period,
    SUM(amount) AS expense
  FROM expenses
  WHERE fk_profile = ?
),
total_incomes AS (
  SELECT
    'TOTAL' AS period,
    SUM(amount) AS income
  FROM incomes
  WHERE fk_profile = ?
),
merged AS (
  SELECT period, income, 0 AS expense FROM total_incomes
  UNION ALL
  SELECT period, 0 AS income, expense FROM total_expenses
),
total AS (
  SELECT
    period,
    SUM(income) AS income,
    SUM(expense) AS expense
  FROM merged
)
SELECT
    period,
    income,
    expense,
    income - expense AS balance
FROM total;
WITH monthly_stats AS (
  SELECT
    fk_profile,
    strftime('%Y-%m', date) AS month,
    SUM(total_expense_amount) AS month_total,
    COUNT(*) AS days_in_month,
    CAST(SUM(total_expense_amount) * 1.0 / COUNT(*) AS INTEGER) AS monthly_average
  FROM daily_summary
  WHERE fk_profile = :profileId
  GROUP BY fk_profile, month
)
SELECT
  d.date,
  d.average_daily_expense AS historical_average,
  m.monthly_average
FROM daily_summary d
JOIN monthly_stats m
  ON m.fk_profile = d.fk_profile
 AND m.month = strftime('%Y-%m', d.date)
WHERE d.fk_profile = :profileId
ORDER BY d.date;

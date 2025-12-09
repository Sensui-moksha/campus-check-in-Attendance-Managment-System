/**
 * Period utilities for attendance filtering
 */

/**
 * Calculate period range from reference date
 */
exports.getPeriodRange = (date, period) => {
  const refDate = new Date(date);
  let start, end;

  if (period === 'day') {
    start = new Date(refDate.setHours(0, 0, 0, 0));
    end = new Date(refDate.setHours(23, 59, 59, 999));
  } else if (period === 'week') {
    const dayOfWeek = refDate.getDay();
    const diff = refDate.getDate() - dayOfWeek;
    start = new Date(refDate.setDate(diff));
    start.setHours(0, 0, 0, 0);
    end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'month') {
    start = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
    end = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  }

  return { start, end };
};

/**
 * Format date for display
 */
exports.formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

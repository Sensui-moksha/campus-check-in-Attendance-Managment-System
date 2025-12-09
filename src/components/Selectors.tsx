import React from 'react';

/**
 * YearSelector - Select academic year (1-4)
 */
export function YearSelector({ value, onChange, label = 'Year of Study' }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value ? parseInt(e.target.value) : null)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Years</option>
        <option value="1">Year 1</option>
        <option value="2">Year 2</option>
        <option value="3">Year 3</option>
        <option value="4">Year 4</option>
      </select>
    </div>
  );
}

/**
 * SemesterSelector - Select semester (1-8)
 */
export function SemesterSelector({ value, onChange, label = 'Semester' }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value ? parseInt(e.target.value) : null)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Semesters</option>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
          <option key={sem} value={sem}>
            Semester {sem}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * BatchYearSelector - Select batch year dynamically
 */
export function BatchYearSelector({ value, onChange, label = 'Batch Year' }) {
  const currentYear = new Date().getFullYear();
  const batchYears = [];
  for (let i = currentYear; i >= currentYear - 4; i--) {
    batchYears.push(i);
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <select
        value={value || ''}
        onChange={e => onChange(e.target.value ? parseInt(e.target.value) : null)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">All Batches</option>
        {batchYears.map(year => (
          <option key={year} value={year}>
            {year} Batch
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Semester Utility Constants and Functions
 * Maps semester numbers (1-8) to year and semester labels
 */

export const SEMESTER_OPTIONS = [
  { value: '1', label: '1st Year 1st Semester', year: 1, semester: 1 },
  { value: '2', label: '1st Year 2nd Semester', year: 1, semester: 2 },
  { value: '3', label: '2nd Year 1st Semester', year: 2, semester: 1 },
  { value: '4', label: '2nd Year 2nd Semester', year: 2, semester: 2 },
  { value: '5', label: '3rd Year 1st Semester', year: 3, semester: 1 },
  { value: '6', label: '3rd Year 2nd Semester', year: 3, semester: 2 },
  { value: '7', label: '4th Year 1st Semester', year: 4, semester: 1 },
  { value: '8', label: '4th Year 2nd Semester', year: 4, semester: 2 },
];

/**
 * Get semester label from value
 */
export const getSemesterLabel = (value: string | number): string => {
  const option = SEMESTER_OPTIONS.find(opt => opt.value === String(value));
  return option?.label || `Semester ${value}`;
};

/**
 * Get year from semester value
 */
export const getYearFromSemester = (semesterValue: string | number): number => {
  const option = SEMESTER_OPTIONS.find(opt => opt.value === String(semesterValue));
  return option?.year || 1;
};

/**
 * Get semesters for a specific year
 */
export const getSemestersForYear = (year: number): typeof SEMESTER_OPTIONS => {
  return SEMESTER_OPTIONS.filter(opt => opt.year === year);
};

/**
 * Get all semester values (1-8)
 */
export const getAllSemesterValues = (): string[] => {
  return SEMESTER_OPTIONS.map(opt => opt.value);
};

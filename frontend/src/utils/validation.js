// Input Form Validation Rules
// Based on machine learning model domain boundaries

export const validateInputs = (data) => {
  const errors = {};

  // Attendance validation
  if (data.attendance_pct === undefined || data.attendance_pct === '') {
    errors.attendance_pct = 'Attendance is required.';
  } else {
    const val = parseFloat(data.attendance_pct);
    if (isNaN(val) || val < 0 || val > 100) {
      errors.attendance_pct = 'Attendance must be a percentage between 0 and 100.';
    }
  }

  // Study hours validation
  if (data.study_hours_week === undefined || data.study_hours_week === '') {
    errors.study_hours_week = 'Study hours are required.';
  } else {
    const val = parseFloat(data.study_hours_week);
    if (isNaN(val) || val < 0 || val > 40) {
      errors.study_hours_week = 'Study hours must be between 0 and 40 hours/week.';
    }
  }

  // Assignment score validation
  if (data.assignment_score === undefined || data.assignment_score === '') {
    errors.assignment_score = 'Assignment score is required.';
  } else {
    const val = parseFloat(data.assignment_score);
    if (isNaN(val) || val < 0 || val > 100) {
      errors.assignment_score = 'Assignment score must be between 0 and 100.';
    }
  }

  // Internal marks validation
  if (data.internal_marks === undefined || data.internal_marks === '') {
    errors.internal_marks = 'Internal marks are required.';
  } else {
    const val = parseFloat(data.internal_marks);
    if (isNaN(val) || val < 0 || val > 100) {
      errors.internal_marks = 'Internal marks must be between 0 and 100.';
    }
  }

  // Previous Sem CGPA validation
  if (data.prev_sem_cgpa === undefined || data.prev_sem_cgpa === '') {
    errors.prev_sem_cgpa = 'Previous Semester CGPA is required.';
  } else {
    const val = parseFloat(data.prev_sem_cgpa);
    if (isNaN(val) || val < 0 || val > 10.0) {
      errors.prev_sem_cgpa = 'CGPA must be between 0.0 and 10.0.';
    }
  }

  // Activity score validation
  if (data.activity_score === undefined || data.activity_score === '') {
    errors.activity_score = 'Activity score is required.';
  } else {
    const val = parseFloat(data.activity_score);
    if (isNaN(val) || val < 0 || val > 100) {
      errors.activity_score = 'Activity score must be between 0 and 100.';
    }
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

import { jsPDF } from 'jspdf';

/**
 * Generates and downloads a clean, simple, and perfectly aligned Student Performance Report.
 * 
 * @param {Object} params
 * @param {string} [params.studentName] - Optional name of the student.
 * @param {Object} params.inputs - Academic input values.
 * @param {Object} params.prediction - Prediction result data.
 * @param {Object} [params.whatIf] - Optional what-if analysis comparison result.
 */
export const generatePDFReport = ({ studentName, inputs, prediction, whatIf }) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 20;
  const rightMargin = pageWidth - margin; // 190mm
  const contentWidth = rightMargin - margin; // 170mm

  const nameToUse = (studentName && studentName.trim() && studentName !== 'Student')
    ? studentName.trim()
    : 'Student';

  const currentDate = new Date().toLocaleDateString('en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  let y = 22;

  // ==========================================
  // HEADER (Clean, Minimalist, Perfectly Aligned)
  // ==========================================
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text("STUDENT PERFORMANCE REPORT", margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text(`Date: ${currentDate}`, rightMargin, y, { align: 'right' });

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("EduPredict AI • Performance Diagnostic System", margin, y);

  if (nameToUse !== 'Student') {
    doc.text(`Student: ${nameToUse}`, rightMargin, y, { align: 'right' });
  }

  y += 6;
  // Header divider line
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.4);
  doc.line(margin, y, rightMargin, y);

  y += 10;

  // Helper for Section Titles
  const addSectionHeader = (title) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text(title.toUpperCase(), margin, y);
    y += 4;
    doc.setDrawColor(203, 213, 225); // Slate-300
    doc.setLineWidth(0.2);
    doc.line(margin, y, rightMargin, y);
    y += 7;
  };

  // ==========================================
  // 1. ACADEMIC INPUT METRICS
  // ==========================================
  addSectionHeader("1. Academic Input Profile");

  doc.setFontSize(9);
  const leftColLabelX = margin;
  const leftColValX = margin + 45;
  const rightColLabelX = margin + 90;
  const rightColValX = margin + 135;

  const leftMetrics = [
    { label: "Attendance:", val: `${inputs.attendance_pct}%` },
    { label: "Study Hours:", val: `${inputs.study_hours_week} hrs/week` },
    { label: "Previous CGPA:", val: `${inputs.prev_sem_cgpa}` }
  ];

  const rightMetrics = [
    { label: "Assignment Score:", val: `${inputs.assignment_score}%` },
    { label: "Internal Marks:", val: `${inputs.internal_marks}%` },
    { label: "Activity Score:", val: `${inputs.activity_score || 'N/A'}${inputs.activity_score ? '%' : ''}` }
  ];

  for (let i = 0; i < 3; i++) {
    const leftItem = leftMetrics[i];
    const rightItem = rightMetrics[i];

    // Left Column
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(leftItem.label, leftColLabelX, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(leftItem.val, leftColValX, y);

    // Right Column
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(rightItem.label, rightColLabelX, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(rightItem.val, rightColValX, y);

    y += 6;
  }

  y += 6;

  // ==========================================
  // 2. PREDICTION DIAGNOSTIC & RISK
  // ==========================================
  addSectionHeader("2. Diagnostic Results");

  const predictedMarks = Math.round(
    prediction.predicted_final_marks || prediction.predicted_final_marks === 0
      ? prediction.predicted_final_marks
      : 0
  );
  const rawMarksExact = parseFloat(prediction.predicted_final_marks || 0).toFixed(2);
  const riskLevel = (prediction.risk_level || 'Moderate').toUpperCase();

  doc.setFontSize(9);

  // Row 1: Predicted Marks
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Predicted Final Exam Marks:", margin, y);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text(`${rawMarksExact} / 100`, leftColValX, y);

  // Row 2: Risk Tier
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text("Risk Level Assessment:", rightColLabelX, y);
  doc.setFont("helvetica", "bold");
  if (riskLevel === 'HIGH' || predictedMarks < 50) {
    doc.setTextColor(225, 29, 72); // Rose red
  } else if (riskLevel === 'LOW' || predictedMarks >= 75) {
    doc.setTextColor(16, 185, 129); // Emerald green
  } else {
    doc.setTextColor(217, 119, 6); // Amber
  }
  doc.text(riskLevel, rightColValX, y);

  y += 10;

  // ==========================================
  // 3. KEY PERFORMANCE FACTORS
  // ==========================================
  addSectionHeader("3. Key Performance Factors");

  const factors = [];
  if (parseFloat(inputs.attendance_pct) < 75) {
    factors.push("Attendance is below 75% threshold (Requires attention).");
  } else if (parseFloat(inputs.attendance_pct) < 90) {
    factors.push("Attendance is satisfactory; maintaining above 90% is recommended.");
  } else {
    factors.push("Attendance is strong (90%+), supporting overall academic consistency.");
  }

  if (parseFloat(inputs.study_hours_week) < 10) {
    factors.push("Weekly study time is under 10 hours/week.");
  } else {
    factors.push("Weekly study duration meets minimum recommendations.");
  }

  if (prediction.contributions && prediction.contributions.length > 0) {
    const mainFeature = prediction.contributions[0];
    const nameMap = {
      attendance_pct: 'Attendance',
      study_hours_week: 'Weekly study duration',
      assignment_score: 'Assignment marks',
      internal_marks: 'Internal exam marks',
      prev_sem_cgpa: 'Previous semester CGPA',
      activity_score: 'Classroom activity score'
    };
    const featName = nameMap[mainFeature.feature] || mainFeature.feature;
    factors.push(`${featName} is a key influence on the predicted final result.`);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  factors.forEach((factor) => {
    doc.text(`•  ${factor}`, margin, y);
    y += 5.5;
  });

  y += 5;

  // ==========================================
  // 4. ACTIONABLE RECOMMENDATIONS
  // ==========================================
  addSectionHeader("4. Recommended Action Steps");

  let recsList = [];
  if (prediction.detailed_recommendations && prediction.detailed_recommendations.actionable_steps) {
    recsList = prediction.detailed_recommendations.actionable_steps.map(
      (step) => `${step.title}: ${step.action}`
    );
  } else if (prediction.recommendations && prediction.recommendations.length > 0) {
    recsList = prediction.recommendations;
  } else {
    recsList = ["Maintain current study habits and monitor semester progress regularly."];
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);

  recsList.slice(0, 3).forEach((rec, idx) => {
    const textStr = `${idx + 1}.  ${rec}`;
    const splitLines = doc.splitTextToSize(textStr, contentWidth);
    splitLines.forEach((line) => {
      doc.text(line, margin, y);
      y += 5.5;
    });
    y += 1;
  });

  y += 4;

  // ==========================================
  // 5. WHAT-IF ANALYSIS (If applicable)
  // ==========================================
  if (whatIf) {
    addSectionHeader("5. What-If Scenario Analysis");

    doc.setFontSize(9);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Baseline Prediction:", margin, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 41, 59);
    doc.text(`${parseFloat(whatIf.current_prediction).toFixed(2)} marks`, leftColValX, y);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Simulated Prediction:", rightColLabelX, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    doc.text(`${parseFloat(whatIf.what_if_prediction).toFixed(2)} marks`, rightColValX, y);

    y += 6;

    const change = parseFloat(whatIf.predicted_change);
    const changeText = `${change >= 0 ? '+' : ''}${change.toFixed(2)} marks`;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Estimated Impact:", margin, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(change >= 0 ? 16 : 225, change >= 0 ? 185 : 29, change >= 0 ? 129 : 72);
    doc.text(changeText, leftColValX, y);

    y += 10;
  }

  // ==========================================
  // FOOTER (Simple, Clean, Aligned Bottom)
  // ==========================================
  const footerY = pageHeight - 15;

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, rightMargin, footerY - 5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text("EduPredict AI • Automated Academic Performance System", margin, footerY);

  doc.text("Page 1 of 1", rightMargin, footerY, { align: 'right' });

  // Clean filename: Student_Performance_Report.pdf
  const cleanFileName = nameToUse !== 'Student' 
    ? `${nameToUse.replace(/[^a-z0-9]/gi, '_')}_Performance_Report.pdf`
    : 'Student_Performance_Report.pdf';

  doc.save(cleanFileName);
};

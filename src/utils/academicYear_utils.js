// utils/academicYear.js

// 1️⃣ Determine academic year based on current date
exports.getAcademicYear = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1; // Jan = 0 → +1

  if (month >= 7) return `${year}-${(year + 1).toString().slice(-2)}`;
  else return `${year - 1}-${year.toString().slice(-2)}`;
};

// 2️⃣ Determine admission year from class year and academic year
exports.getAdmissionYear = (academicYear, className) => {
  const startYear = parseInt(academicYear.split('-')[0]);
  switch (className) {
    case "1st Year": return startYear;
    case "2nd Year": return startYear - 1;
    case "3rd Year": return startYear - 2;
    case "4th Year": return startYear - 3;
    default: return startYear;
  }
};

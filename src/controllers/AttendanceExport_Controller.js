const ExcelJS = require("exceljs");
const AttendanceCode = require("../models/AttendanceCode_Model");
const AttendanceRecord = require("../models/AttendanceRecord_Model");
const Student = require("../models/Student_Model");

// GET /api/attendance/export/:department/:subject/:className/:academicYear
exports.exportAttendanceExcel = async (req, res) => {
  try {
    console.log("🟩 Export called with:", req.params);
    const { department, subject, className, academicYear } = req.params;

    if (!department || !subject || !className || !academicYear) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: department, subject, className, academicYear"
      });
    }

    // Fetch all attendance codes for this session
    console.log("🔍 Searching AttendanceCode for:", { department, subject, className, academicYear });
    
    const codes = await AttendanceCode.find({
      department,
      subject,
      className,
      academicYear
    }).sort({ generatedAt: 1 });

    console.log("🟦 Found codes:", codes.length);

    if (codes.length === 0) {
      return res.status(404).json({ success: false, message: "No classes found" });
    }

    const uniqueDates = [...new Set(codes.map(c =>
      new Date(c.generatedAt).toLocaleDateString("en-GB")
    ))];

    // Get students for this batch
    const admissionYear = codes[0].admissionYear;
    const students = await Student.find({ department, admission_year:admissionYear }).sort({ roll: 1 });

    // Create Excel workbook
    //const ExcelJS = require("exceljs");
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Attendance");

    // Header info
    sheet.addRow([`Academic Year: ${academicYear}`]);
    sheet.addRow([`Class: BTECH (${className})`]);
    sheet.addRow([`Department: ${department}`]);
    sheet.addRow([`Subject: ${subject}`]);
    sheet.addRow([]);

    // Table header
    const header = ["Roll", "Name", ...uniqueDates];
    sheet.addRow(header);

    // Fill attendance data
    for (const student of students) {
      const row = [student.roll, student.name];

      for (const date of uniqueDates) {
        const matchingCode = codes.find(
          c => new Date(c.generatedAt).toLocaleDateString("en-GB") === date
        );

        const record = await AttendanceRecord.findOne({
          studentId: student.studentid.toString(),
          code: matchingCode?.code
        });

        row.push(record ? "P" : "A");
      }

      sheet.addRow(row);
    }

    sheet.columns.forEach(col => {
      col.width = 15;
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Attendance_${department}_${className}_${subject}_${academicYear}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("❌ Error generating Excel:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

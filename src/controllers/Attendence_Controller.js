const dayjs=require('dayjs')

const AttendanceCode=require('../models/AttendanceCode_Model');
const AttendanceRecord=require('../models/AttendanceRecord_Model');
const Student = require('../models/Student_Model')

exports.generateCode= async (req, res) => {
  const { teacherId, department, subject } = req.body;

  if (!teacherId || !department || !subject) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  // Generate random 4-digit code
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  const generatedAt = new Date();
  const expiresAt = new Date(generatedAt.getTime() + 5 * 60 * 1000); // 30 minutes validity
  const formattedExpiresAt = `${dayjs(expiresAt).format('DD-MM-YYYY')}T${dayjs(expiresAt).format('hh:mm:ss A')}`;

  const newCode = new AttendanceCode({
    code,
    department,
    subject,
    teacherId,
    generatedAt,
    expiresAt
    //formattedExpiresAt
  });

  try {
    await newCode.save();
    console.log("✅ Code generated and saved:", newCode);

    return res.status(201).json({
      success: true,
      message: "Code generated successfully",
      code: newCode.code,
      expiresAt: formattedExpiresAt
    });

  } catch (err) {
    console.error("❌ Error generating code:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


exports.getLatestCode=async (req, res) => {
  const { department } = req.params;

  try {
    const now = new Date();

    console.log("📥 Received request for department:", department);
    const latestCode = await AttendanceCode.findOne({
      department: department,
      expiresAt: { $gt: now }
    }).sort({ generatedAt: -1 }); // latest one first

    if (!latestCode) {
      console.log("⚠️ No active code found for:", department);
      return res.status(404).json({ success: false, message: "No active code found" });
    }
    else{
      console.log("✅ Found code:", latestCode.code, "Expires at:", latestCode.expiresAt);
    } 
    const isActive = latestCode.expiresAt > new Date();

    return res.status(200).json({
      success: true,
      code: latestCode.code,
      subject: latestCode.subject,
      expiresAt: latestCode.expiresAt,
      active: isActive
    });

  } catch (err) {
    console.error("❌ Error fetching latest code:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

 exports.submitAttendance=async (req, res) => {
  const { studentId, department, code } = req.body;

  if (!studentId || !department || !code) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  try {
    const now = new Date();

    const activeCode = await AttendanceCode.findOne({
      department: department,
      code: code,
      expiresAt: { $gt: now }
    });

    if (!activeCode) {
      return res.status(400).json({ success: false, message: "Invalid or expired code" });
    }
    console.log("📥 Attendance Submission Request:");
    console.log({ studentId, department, code });
    console.log("✅ Active code found:", activeCode);

    const newAttendance = new AttendanceRecord({
      studentId,
      department,
      subject: activeCode.subject,
      teacherId: activeCode.teacherId,
      code: activeCode.code,
      timestamp: new Date()
    });

    await newAttendance.save();
    console.log("✅ Attendance saved:", newAttendance);

    return res.status(200).json({ success: true, message: "Attendance marked successfully" });

  } catch (err) {
    console.error("❌ Error submitting attendance:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET /api/attendance/summary/:studentId/:department
exports.getStudentSummary= async (req, res) => {
  const { studentId, department } = req.params;

  try {
    // 1. Get all codes generated for this department
    const allCodes = await AttendanceCode.find({ department });

    // 2. Group codes by subject
    const subjectToCodes = {};
    allCodes.forEach(codeDoc => {
      const subject = codeDoc.subject;
      if (!subjectToCodes[subject]) subjectToCodes[subject] = [];
      subjectToCodes[subject].push(codeDoc.code);
    });

    // 3. For each subject, calculate how many times the student attended
    const summary = {};

    for (const [subject, codes] of Object.entries(subjectToCodes)) {
      const held = codes.length;
      console.log(`Checking subject: ${subject}`);
      console.log(`Student ID: ${studentId}, Department: ${department}`);
      console.log(`Codes:`, codes);

      const attended = await AttendanceRecord.countDocuments({
        studentId,
        department,
        subject,
        code: { $in: codes }
      });
      console.log(`Attended count for ${subject}:`, attended);

      const percentage = held === 0 ? 0 : Math.round((attended / held) * 100);

      summary[subject] = {
        held,
        attended,
        percentage
      };
    }

    return res.json({
      success: true,
      studentId,
      department,
      summary
    });

  } catch (err) {
    console.error("❌ Error in summary route:", err.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getSubjectSummary=async (req, res) => {
  const { department, subject } = req.params;

  try {
    // Step 1: Get all attendance codes generated for this department + subject
    const allCodes = await AttendanceCode.find({ department, subject });
    const codeList = allCodes.map(c => c.code);
    const totalClasses = codeList.length;

    // Step 2: Get all students in the department (teacher wants to see everyone, even zero attendance)
    const allStudents = await Student.find({ department });

    // If no classes have been held yet, return all students with zero values
    if (totalClasses === 0) {
      const summary = allStudents.map(student => ({
        studentId: student.studentid,
        name: student.name,
        department: student.department,
        present: 0,
        total: 0,
        percentage: 0,
        status: "Below 75%"
      }));
      return res.status(200).json({ success: true, summary, totalClasses: 0 });
    }

    // Step 3: Get all attendance records for these codes
    const attendanceRecords = await AttendanceRecord.find({
      department,
      subject,
      code: { $in: codeList }
    });

    // Step 4: Count attendance per student
    const attendanceMap = {}; // { studentId: { present: X } }
    attendanceRecords.forEach(record => {
      const id = record.studentId;
      if (!attendanceMap[id]) {
        attendanceMap[id] = { present: 0 };
      }
      attendanceMap[id].present += 1;
    });

    // Step 5: Build final summary for all students, including those with zero attendance
    const summary = allStudents.map(student => {
      const attended = attendanceMap[student.studentid]?.present || 0;
      const percentage = Math.round((attended / totalClasses) * 100);
      return {
        studentId: student.studentid,
        name: student.name,
        department: student.department,
        present: attended,
        total: totalClasses,
        percentage,
        status: percentage >= 75 ? "Above 75%" : "Below 75%"
      };
    });

    return res.status(200).json({ success: true, summary, totalClasses });

  } catch (err) {
    console.error("❌ Error fetching student summary:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
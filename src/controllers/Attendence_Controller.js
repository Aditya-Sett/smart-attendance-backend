const dayjs=require('dayjs')
const turf = require('@turf/turf');
const timezone = require('dayjs/plugin/timezone');

const AttendanceCode=require('../models/AttendanceCode_Model');
const AttendanceRecord=require('../models/AttendanceRecord_Model');
const Student = require('../models/Student_Model');
const LeaveAdjustment = require('../models/LeaveAdjustment_Model');
const Classroom = require("../models/Classroom_Model");
const getDistanceFromLatLonInM = require('../utils/distance');
const { getAcademicYear, getAdmissionYear, isCodeExist } = require('../utils/academicYear_utils');


dayjs.extend(timezone);

// ========== 1. Generate Code ==========
exports.generateCode = async (req, res) => {
  const { teacherId, department, subject, wifiFingerprint, sem, bluetoothUuid } = req.body;  //⚡ added className

  if (!teacherId || !department || !subject || !wifiFingerprint || !sem || !bluetoothUuid) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  let className = "";

  if (sem === "1st" || sem === "2nd"){
    className = "1st Year";
  } else if (sem === "3rd" || sem === "4th") {
  className = "2nd Year";
} else if (sem === "5th" || sem === "6th") {
  className = "3rd Year";
} else if (sem === "7th" || sem === "8th") {
  className = "4th Year";
} else {
  return res.status(400).json({ success: false, message: "Invalid semester" });
}

  // ⚡ Determine academic year & admission year
  const academicYear = getAcademicYear();
  const admissionYear = getAdmissionYear(academicYear, className);

  const isCodeExists= await isCodeExist(department,admissionYear,teacherId,subject);

  if (isCodeExists) {
      return res.status(409).json({ success: false, message: `Previous code is ACTIVE for ${department}-> ${admissionYear}` });
  }

  // Generate random 4-digit code
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  const generatedAt = new Date();
  const expiresAt = new Date(generatedAt.getTime() + process.env.EXPIRY_TIME * 60 * 1000); // 5 mins validity
  /*const formattedExpiresAt = `${dayjs(expiresAt).format("DD-MM-YYYY")}T${dayjs(
    expiresAt
  ).format("hh:mm:ss A")}`;*/
  const wifiFingerprintArray = Array.isArray(wifiFingerprint) ? wifiFingerprint : [];

  const newCode = new AttendanceCode({
    code,
    department,
    subject,
    teacherId,
    className,      // ⚡ store class
    sem,
    academicYear,       // ⚡ store academic year
    admissionYear,      // ⚡ store admission year
    generatedAt,
    expiresAt,
    wifiFingerprint:wifiFingerprintArray,   // ✅ save teacher’s WiFi snapshot
    bluetoothUuid
  });

  try {
    await newCode.save();
    console.log("✅ Code generated and saved:", newCode);

    return res.status(201).json({
      success: true,
      message: "Code generated successfully",
      code: newCode.code,
      generatedAt:dayjs(generatedAt).tz("Asia/Kolkata").format("DD-MM-YYYY hh:mm:ss A"),
      expiresAt: dayjs(expiresAt).tz("Asia/Kolkata").format("DD-MM-YYYY hh:mm:ss A"),
      subject,
      teacherId,
      className,
      sem,
      department,
      academicYear,
      admissionYear
    });
  } catch (err) {
    console.error("❌ Error generating code:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.deleteCode= async(req, res)=> {
  const { teacherId, department, subject, className } = req.body;

  if (!teacherId || !department || !subject || !className) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try{

    const now = new Date();

    const result=await AttendanceCode.deleteMany({
      teacherId,
      department,
      subject,
      className,
      expiresAt: { $gt: now }
    });

    if(result.deletedCount==0){
      return res.status(404).json({ 
        success: false, 
        message: `No codes found for [${teacherId}, ${department}, ${subject}, ${className}]`
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: `${result.deletedCount} code(s) deleted successfully` 
    });

  }catch(error){
     console.error("Error deleting code:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal server error",
      error: error.message 
    });
  }

};

//.format("DD-MM-YYYY hh:mm:ss A")
// ========== 2. Get Latest Code ==========
exports.getLatestCode = async (req, res) => {
  const { department, admissionYear } = req.body;

  if (!department || !admissionYear) {
    return res.status(400).json({ success: false, message: "Missing department and admissionYear" });
  }

  console.log("🟩 Checking code for:", { department, admissionYear });

  try {
    const now = new Date();

    const latestCode = await AttendanceCode.findOne({
      department: department,
      admissionYear,
      expiresAt: { $gt: now }
    }).sort({ generatedAt: -1 });

    if (!latestCode) {
      return res.status(404).json({ success: false, message: "No active code found" });
    }

    return res.status(200).json({
      success: true,
      message: "Code available",
      subject: latestCode.subject,
      expiresAt: latestCode.expiresAt,
      code: latestCode.code,
      active: true,
      wifiFingerprint: latestCode.wifiFingerprint, // ✅ send reference fingerprint
      className: latestCode.className,              // optional - for frontend use
      academicYear: latestCode.academicYear ,        // optional - helpful context
      bluetoothUuid:latestCode.bluetoothUuid
    });
  } catch (err) {
    console.error("❌ Error fetching latest code:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// ========== 3. Submit Attendance ==========
exports.submitAttendance = async (req, res) => {
  const { studentId, department, code, academic_year, sem, wifiFingerprint } = req.body;

  if (!studentId || !department || !code || !academic_year || !sem) {
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

    /*// ✅ Compare WiFi fingerprints (very simple version)
    const matchCount = wifiFingerprint.filter(studentAp =>
      activeCode.wifiFingerprint.some(
        teacherAp => teacherAp.BSSID === studentAp.BSSID
      )
    ).length;*/
    console.log("📡 Teacher FP:", activeCode.wifiFingerprint);
    console.log("📡 Student FP:", wifiFingerprint);
    const teacherFingerprint = Array.isArray(activeCode.wifiFingerprint) ? activeCode.wifiFingerprint : [];
    const studentFingerprint = Array.isArray(wifiFingerprint) ? wifiFingerprint : [];
    const matches = studentFingerprint.filter(studentAp =>
  teacherFingerprint.some(
    teacherAp =>
      teacherAp.BSSID === studentAp.BSSID &&
      Math.abs(teacherAp.level - studentAp.level) <= 10
  )
);

    //const similarity = matchCount / activeCode.wifiFingerprint.length;
    const similarity = matches.length / Math.max(teacherFingerprint.length, 1);

    // if (similarity < 0.5) { // threshold 50%
    //   return res.status(403).json({ success: false, message: "WiFi fingerprint mismatch" });
    // }

    // Save attendance
    const newAttendance = new AttendanceRecord({
      studentId,
      department,
      subject: activeCode.subject,
      teacherId: activeCode.teacherId,
      code: activeCode.code,
      academic_year: academic_year,
      sem: sem,
      timestamp: new Date(),
      wifiFingerprint: wifiFingerprint,
      by: "A"
    });

    await newAttendance.save();

    return res.status(200).json({ success: true, message: "Attendance marked successfully" });

  } catch (err) {
    console.error("❌ Error submitting attendance:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.saveAttendance = async (req, res) => {
  // Destructure the list of students and the shared session details
  const { students,teacherId,department, generatedAt, subject,academic_year, sem } = req.body;

  // 1. Basic Validation
  if (!Array.isArray(students) || students.length === 0 || !department || !academic_year || !sem || !teacherId || !generatedAt || !subject) {
    return res.status(400).json({ success: false, message: "Missing required fields or empty student list" });
  }

  try {

    // 2. Validate the Attendance Code once for the whole batch
    const codeExist = await AttendanceCode.findOne({
      teacherId: teacherId,
      department: department,
      generatedAt: generatedAt,
      subject: subject,
      sem: sem,
      academicYear: academic_year
    });

    if (!codeExist) {
      return res.status(400).json({ success: false, message: "Invalid code" });
    }

    // 3. Prepare the data for bulk insertion
    const attendanceData = students.map(studentId => ({
      studentId,
      department,
      subject: codeExist.subject,
      teacherId: codeExist.teacherId,
      code: codeExist.code,
      academic_year: academic_year,
      sem: sem,
      timestamp: new Date(),
      by: "M" // Assuming "A" stands for Admin/Automated bulk entry
    }));

    // 4. Bulk Insert into MongoDB
    // { ordered: false } ensures that if one fails, the rest still proceed
    await AttendanceRecord.insertMany(attendanceData, { ordered: false });

    return res.status(200).json({ 
      success: true, 
      message: `Attendance marked successfully for ${students.length} students.` 
    });

  } catch (err) {
    console.error("❌ Error submitting bulk attendance:", err);
    
    // Handle potential duplicate key errors if a student is already marked
    if (err.code === 11000) {
      return res.status(207).json({ 
        success: true, 
        message: "Attendance processed, but some duplicates were skipped." 
      });
    }

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
  try {
    const { department, subject } = req.params;

    // Validate input
    if (!department || !subject) {
      return res.status(400).json({ success: false, message: "Department and subject are required" });
    }

    // Get total classes held for this department + subject
    const totalClassesHeld = await AttendanceCode.countDocuments({ department, subject });

    // Get all students in this department
    const students = await Student.find({ department });
    if (!students || students.length === 0) {
      return res.json({ success: true, summary: [], message: "No students found for this department" });
    }

    const summary = await Promise.all(students.map(async (student) => {
      // Get attended classes count
      const attendedClasses = await AttendanceRecord.countDocuments({
        studentId: student.studentid.toString(),
        department,
        subject
      });

      // Get excused classes for this student
      const leaveAdjustments = await LeaveAdjustment.find({
        studentId: student._id.toString(),
        department
      });

      let excusedCount = 0;
      for (const leave of leaveAdjustments) {
        excusedCount += leave.excusedClasses.filter(e => e.subject.trim() === subject.trim()).length;
      }

      // Adjust total classes held for this student
      const adjustedTotal = Math.max(totalClassesHeld - excusedCount, 0);
      //const adjustedTotal = attendedClasses + excusedCount;
      const percentage = adjustedTotal > 0
        ? (attendedClasses / adjustedTotal) * 100
        : 100;

      return {
        studentId: student.studentid,
        name: student.name,
        department: student.department,
        present: attendedClasses,
        excused: excusedCount,
        total: totalClassesHeld,
        consideredTotal: adjustedTotal,
        percentage: Number(percentage.toFixed(2)),
        status: percentage >= 75 ? "Above 75%" : "Below 75%"
      };
    }));

    res.json({ success: true, summary});

  } catch (err) {
    console.error("Error fetching attendance summary:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.approveLeave=async (req, res) => {
  const { department, students, fromDate, toDate, reason } = req.body;

  if (!department || !students || !fromDate || !toDate) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  try {
    // 1. Get all classes held in that range for this department
    const classesHeld = await AttendanceCode.find({
      department,
      generatedAt: {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      }
    });

    if (classesHeld.length === 0) {
      return res.status(404).json({ success: false, message: "No classes found in that range" });
    }

    // 2. Prepare excused classes
    const excusedList = classesHeld.map(c => ({
      subject: c.subject,
      date: c.generatedAt
    }));

    // 3. Save leave adjustment for each student
    for (const studentId of students) {
      const leave = new LeaveAdjustment({
        studentId,
        department,
        fromDate,
        toDate,
        reason,
        excusedClasses: excusedList
      });
      await leave.save();
    }

    res.status(201).json({
      success: true,
      message: "Leave approved successfully",
      excusedCount: excusedList.length
    });

  } catch (err) {
    console.error("❌ Error approving leave:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.attendance_taken_by_teacherid = async (req, res) => {
  const { teacherId } = req.body;

  if (!teacherId) {
    return res.status(400).json({
      success: false,
      message: "teacherId is required"
    });
  }

  try {
    // Fetch all codes for this teacher
    const codes = await AttendanceCode.find({ teacherId }).sort({ generatedAt: -1 });

    if (!codes || codes.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No codes found for this teacher",
        data: []
      });
    }

    // Clean formatted response
    const formatted = codes.map(c => ({
      id: c._id,
      code: c.code,
      department: c.department,
      subject: c.subject,
      className: c.className,
      academicYear: c.academicYear,
      admissionYear: c.admissionYear,
      generatedAt: dayjs(c.generatedAt).tz("Asia/Kolkata").format("DD-MM-YYYY hh:mm:ss A"),
      expiresAt: dayjs(c.expiresAt).tz("Asia/Kolkata").format("DD-MM-YYYY hh:mm:ss A"),
      //generatedAtOri: c.generatedAt,
      //expiresAtOri: c.expiresAt,
      //wifiFingerprint: c.wifiFingerprint,
      bluetoothUuid: c.bluetoothUuid
    }));

    return res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted
    });

  } catch (error) {
    console.error("❌ Error fetching codes by teacher:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ========== 8. Get Attendance Details for a Specific Code ==========
exports.getAttendanceDetails = async (req, res) => {
  const { teacherId, code, generatedAt, expiresAt } = req.body;

  if (!teacherId || !code || !generatedAt || !expiresAt) {
    return res.status(400).json({ 
      success: false, 
      message: "Missing required fields: teacherId, code, generatedAt, expiresAt" 
    });
  }
  
  console.log("teacherId: ", teacherId);
  console.log("code: ", code);
  console.log("generatedAt (raw): ", generatedAt);
  console.log("expiresAt (raw): ", expiresAt);

  try {
    // Parse DD-MM-YYYY HH:MM:SS AM/PM format
    const parseCustomDate = (dateString) => {
      // Example: "08-12-2025 07:12:06 PM"
      const parts = dateString.split(' ');
      const datePart = parts[0]; // "08-12-2025"
      const timePart = parts[1]; // "07:12:06"
      const ampm = parts[2]; // "PM"
      
      const [day, month, year] = datePart.split('-').map(Number);
      let [hours, minutes, seconds] = timePart.split(':').map(Number);
      
      // Convert 12-hour format to 24-hour format
      if (ampm === 'PM' && hours < 12) {
        hours += 12;
      } else if (ampm === 'AM' && hours === 12) {
        hours = 0;
      }
      
      // Create Date object (month is 0-indexed in JavaScript)
      return new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
    };

    const startDate = parseCustomDate(generatedAt);
    const endDate = parseCustomDate(expiresAt);

    console.log("Searching for code with:");
    console.log("teacherId:", teacherId);
    console.log("code:", code);
    console.log("generatedAt (parsed):", startDate);
    console.log("expiresAt (parsed):", endDate);
    console.log("generatedAt (ISO):", startDate.toISOString());
    console.log("expiresAt (ISO):", endDate.toISOString());

    // 1. Find the attendance code record with flexible date matching
    let codeRecord = await AttendanceCode.findOne({
      teacherId: teacherId.trim(),
      code: code.trim(),
      generatedAt: {
        $gte: new Date(startDate.getTime() - 5000), // 5 seconds before
        $lte: new Date(startDate.getTime() + 5000)  // 5 seconds after
      }
    });

    if (!codeRecord) {
      console.log("No exact match found, trying without date...");
      // Try without date matching as fallback
      const codeRecordFallback = await AttendanceCode.findOne({
        teacherId: teacherId.trim(),
        code: code.trim()
      }).sort({ generatedAt: -1 }); // Get most recent

      if (!codeRecordFallback) {
        return res.status(404).json({ 
          success: false, 
          message: "Attendance code not found" 
        });
      }
      
      console.log("Found fallback record:", codeRecordFallback);
      codeRecord = codeRecordFallback; // Assign to the outer variable
    }

    console.log("Found code record:", codeRecord);

    // 2. Find all attendance records for this code within the time range
    // Use codeRecord's actual dates instead of parsed ones
    const attendanceRecords = await AttendanceRecord.find({
      teacherId: teacherId.trim(),
      code: code.trim(),
      timestamp: { 
        $gte: new Date(codeRecord.generatedAt.getTime() - 30000), // 30 seconds before
        $lte: new Date(codeRecord.expiresAt.getTime() + 30000)    // 30 seconds after
      }
    });

    console.log("Found attendance records:", attendanceRecords.length);

    // Extract studentIds who are present
    const presentStudentIds = attendanceRecords.map(record => record.studentId);

    // 3. Find department and admission_year from any one student who is present
    let department = codeRecord.department;
    let admissionYear = codeRecord.admissionYear;
    
    // If we have at least one attendance record, verify department from student collection
    if (presentStudentIds.length > 0) {
      const sampleStudent = await Student.findOne({ 
        studentid: presentStudentIds[0] 
      });
      
      if (sampleStudent) {
        department = sampleStudent.department || codeRecord.department;
        admissionYear = sampleStudent.admission_year || codeRecord.admissionYear;
      }
    }

    // 4. Find all students in this department and admission year
    const allStudents = await Student.find({ 
      department: department.trim(),
      admission_year: admissionYear 
    }).sort({ roll: 1 }); // Sort by roll number

    // 5. Prepare response with status (P/A)
    const attendanceDetails = allStudents.map(student => {
      const isPresent = presentStudentIds.includes(student.studentid);
      return {
        roll: student.roll,
        name: student.name,
        status: isPresent ? "P" : "A"
      };
    });

    // 6. Sort by roll number (already done in query, but ensuring)
    attendanceDetails.sort((a, b) => {
      // Convert roll to number if possible, otherwise string compare
      const rollA = isNaN(a.roll) ? a.roll : Number(a.roll);
      const rollB = isNaN(b.roll) ? b.roll : Number(b.roll);
      return rollA - rollB;
    });

    return res.status(200).json({
      success: true,
      code,
      teacherId,
      department,
      admissionYear,
      generatedAt: codeRecord.generatedAt,
      expiresAt: codeRecord.expiresAt,
      totalStudents: allStudents.length,
      presentCount: presentStudentIds.length,
      absentCount: allStudents.length - presentStudentIds.length,
      records: attendanceDetails
    });

  } catch (error) {
    console.error("❌ Error fetching attendance details:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error",
      error: error.message 
    });
  }
};
const dayjs=require('dayjs')
//const turf = require('@turf/turf');

const AttendanceCode=require('../models/AttendanceCode_Model');
const AttendanceRecord=require('../models/AttendanceRecord_Model');
const Student = require('../models/Student_Model');
const LeaveAdjustment = require('../models/LeaveAdjustment_Model');
const Classroom = require("../models/Classroom_Model");
const getDistanceFromLatLonInM = require('../utils/distance');

exports.generateCode = async (req, res) => {
  const { teacherId, department, subject, classroom } = req.body;

  if (!teacherId || !department || !subject || !classroom) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  // Fetch classroom polygon from DB
  const classroomDoc = await Classroom.findOne({ number: classroom });
  if (!classroomDoc) {
    return res.status(404).json({ success: false, message: "Classroom not found" });
  }

  // Generate random 4-digit code
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  const generatedAt = new Date();
  const expiresAt = new Date(generatedAt.getTime() + 10 * 60 * 1000); // 5 minutes validity
  const formattedExpiresAt = `${dayjs(expiresAt).format("DD-MM-YYYY")}T${dayjs(
    expiresAt
  ).format("hh:mm:ss A")}`;

  const newCode = new AttendanceCode({
    code,
    department,
    subject,
    teacherId,
    classroom,
    generatedAt,
    expiresAt
  });

  try {
    await newCode.save();
    console.log("✅ Code generated and saved:", newCode);

    return res.status(201).json({
      success: true,
      message: "Code generated successfully",
      code: newCode.code,
      classroom: classroomDoc.number,
      polygon: classroomDoc.polygon, // ✅ send polygon so student can check geofence
      expiresAt: formattedExpiresAt
    });
  } catch (err) {
    console.error("❌ Error generating code:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


exports.getLatestCode = async (req, res) => {
  const { department, studentLat, studentLon } = req.body;

  if (!department || !studentLat || !studentLon) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  try {
    const now = new Date();

    // 🔹 Find latest valid code for department
    const latestCode = await AttendanceCode.findOne({
      department: department,
      expiresAt: { $gt: now }
    }).sort({ generatedAt: -1 });

    if (!latestCode) {
      return res.status(404).json({ success: false, message: "No active code found" });
    }

    // 🔹 Check if student point is inside classroom polygon using MongoDB
    const insideClassroom = await Classroom.findOne({
      number: latestCode.classroom,
      polygon: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(studentLon), parseFloat(studentLat)] // ✅ lon, lat
          }
        }
      }
    });

    if (!insideClassroom) {
      return res.status(403).json({ success: false, message: "You are not in classroom range" });
    }

    return res.status(200).json({
      success: true,
      message: "Code available",
      subject: latestCode.subject,
      classroom: latestCode.classroom,
      expiresAt: latestCode.expiresAt,
      code: latestCode.code,
      active: true
    });

  } catch (err) {
    console.error("❌ Error fetching latest code:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};


exports.submitAttendance = async (req, res) => {
  const { studentId, department, code, studentLat, studentLon } = req.body;

  if (!studentId || !department || !code || !studentLat || !studentLon) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  try {
    const now = new Date();

    // 🔹 Find active code
    const activeCode = await AttendanceCode.findOne({
      department: department,
      code: code,
      expiresAt: { $gt: now }
    });

    if (!activeCode) {
      return res.status(400).json({ success: false, message: "Invalid or expired code" });
    }

    // 🔹 Check if student point is inside classroom polygon using MongoDB
    const insideClassroom = await Classroom.findOne({
      number: activeCode.classroom,
      polygon: {
        $geoIntersects: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(studentLon), parseFloat(studentLat)] // ✅ lon, lat
          }
        }
      }
    });

    if (!insideClassroom) {
      return res.status(403).json({ success: false, message: "You are not in classroom range" });
    }

    // 🔹 Save attendance
    const newAttendance = new AttendanceRecord({
  studentId,
  department,
  subject: activeCode.subject,
  teacherId: activeCode.teacherId,
  code: activeCode.code,
  classroom: activeCode.classroom,
  timestamp: new Date(),
  studentLocation: {
    type: "Point",
    coordinates: [parseFloat(studentLon), parseFloat(studentLat)] // ✅ lon, lat
  }
});

    await newAttendance.save();
    
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
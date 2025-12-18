const express = require('express');
const router = express.Router();
const {
  generateCode,
  getLatestCode,
  submitAttendance,
  getStudentSummary,
  getSubjectSummary,
  approveLeave,
  deleteCode,
  attendance_taken_by_teacherid,
  getAttendanceDetails
} = require('../controllers/Attendence_Controller');

const { exportAttendanceExcel } = require("../controllers/AttendanceExport_Controller");
const { health_check } = require("../controllers/Helth-check_Controller");

router.post('/generate', generateCode);
router.post('/delete',deleteCode)
router.post('/latest', getLatestCode);
router.post('/submit', submitAttendance);
router.get('/summary/:studentId/:department', getStudentSummary);
router.get('/students/:department/:subject', getSubjectSummary);
router.post('/approve-leave', approveLeave);
router.get('/export/:department/:subject/:className/:academicYear', exportAttendanceExcel);
router.post('/attendance_taken_by_teacherid', attendance_taken_by_teacherid);
router.post('/details', getAttendanceDetails);
router.get('/health-check', health_check);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  generateCode,
  getLatestCode,
  submitAttendance,
  getStudentSummary,
  getSubjectSummary
} = require('../controllers/Attendence_Controller');

router.post('/generate', generateCode);
router.get('/latest/:department', getLatestCode);
router.post('/submit', submitAttendance);
router.get('/summary/:studentId/:department', getStudentSummary);
router.get('/students/:department/:subject', getSubjectSummary);

module.exports = router;

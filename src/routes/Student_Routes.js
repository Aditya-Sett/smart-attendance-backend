const express = require('express');
const router = express.Router();
const {
  getStudentsByDepartment
} = require('../controllers/Student_Controller');

router.get('/:department', getStudentsByDepartment);

module.exports = router;
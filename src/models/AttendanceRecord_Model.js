const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  department: { type: String, required: true },
  subject: { type: String, required: true },
  teacherId: { type: String, required: true },
  code: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  studentLat: { type: Number, required: true },
  studentLon: { type: Number, required: true }
}, { strict: true });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);

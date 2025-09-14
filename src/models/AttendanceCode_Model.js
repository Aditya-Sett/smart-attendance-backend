const mongoose = require('mongoose');

const attendanceCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  subject: { type: String, required: true },
  teacherId: { type: String, required: true },
  classroom: { type: String, required: true },
  generatedAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date, required: true }
}, { strict: true });

module.exports = mongoose.model('AttendanceCode', attendanceCodeSchema);

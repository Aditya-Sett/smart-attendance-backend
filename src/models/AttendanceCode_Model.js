const mongoose = require('mongoose');

const attendanceCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  subject: { type: String, required: true },
  teacherId: { type: String, required: true },
  latitude: { type: Number, required: true },   // teacher’s latitude
  longitude: { type: Number, required: true },  // teacher’s longitude
  generatedAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date, required: true }
}, { strict: true });

module.exports = mongoose.model('AttendanceCode', attendanceCodeSchema);

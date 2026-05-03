const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  department: { type: String, required: true },
  subject: { type: String, required: true },
  teacherId: { type: String, required: true },
  code: { type: String, required: true },
  academic_year: { type: String, required: true },
  sem: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },

  // ✅ Store student's location as GeoJSON Point
  wifiFingerprint: [
    {
      SSID: { type: String },
      BSSID: { type: String },
      level: { type: Number }
    }
  ],
  by: { type: String, required: true }
}, { strict: true });

// ✅ Add geospatial index for future queries
//attendanceRecordSchema.index({ studentLocation: "2dsphere" });

// attendanceRecordSchema.index(
//   { studentId: 1, subject: 1, academic_year: 1, sem: 1 , code: 1, department: 1}, 
//   { unique: true }
// );

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);

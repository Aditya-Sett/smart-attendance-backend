const mongoose = require('mongoose');

const wifiFingerprintSchema = new mongoose.Schema({
  SSID: { type: String },   // Network name
  BSSID: { type: String },  // Unique AP identifier (MAC address)
  level: { type: Number }   // Signal strength (dBm)
}, { _id: false });  // 🚀 Prevents ObjectId in each fingerprint entry

const attendanceCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  department: { type: String, required: true },
  subject: { type: String, required: true },
  teacherId: { type: String, required: true },
  className: { type: String, required: true },
  academicYear: { type: String, required: true },
  admissionYear: { type: String },
  generatedAt: { type: Date, required: true, default: Date.now },
  expiresAt: { type: Date, required: true },
  wifiFingerprint: [wifiFingerprintSchema]  // ✅ Use schema with _id: false
}, { strict: true });

module.exports = mongoose.model('AttendanceCode', attendanceCodeSchema);

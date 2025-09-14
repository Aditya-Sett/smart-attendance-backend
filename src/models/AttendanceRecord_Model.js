const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  department: { type: String, required: true },
  subject: { type: String, required: true },
  teacherId: { type: String, required: true },
  code: { type: String, required: true },
  classroom: { type: String, required: true }, // classroom number reference
  timestamp: { type: Date, default: Date.now },

  // ✅ Store student's location as GeoJSON Point
  studentLocation: {
    type: {
      type: String,
      enum: ["Point"],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  }
}, { strict: true });

// ✅ Add geospatial index for future queries
attendanceRecordSchema.index({ studentLocation: "2dsphere" });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);

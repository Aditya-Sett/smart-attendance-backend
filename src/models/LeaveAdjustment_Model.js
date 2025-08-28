const mongoose = require('mongoose');

const leaveAdjustmentSchema = new mongoose.Schema({
  studentId: { type: String, required: true },
  department: { type: String, required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  reason: { type: String },
  excusedClasses: [
    {
      subject: String,
      date: Date
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('LeaveAdjustment', leaveAdjustmentSchema);

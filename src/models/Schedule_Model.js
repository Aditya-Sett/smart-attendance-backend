const mongoose=require("mongoose")

const scheduleSchema = new mongoose.Schema({
  department: { type: String, required: true },
  day: { type: String, required: true },
  time: { type: String, required: true },
  subject: { type: String, required: true },
  room: { type: String, required: true },
  group: { type: String, required: true }
  // add other fields if needed
}, { strict: true }); // ✅ Force strict mode

module.exports = mongoose.model('Schedule', scheduleSchema);
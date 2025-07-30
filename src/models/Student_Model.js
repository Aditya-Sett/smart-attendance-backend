const mongoose=require('mongoose');

const studentSchema = new mongoose.Schema({
  studentid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  department: { type: String, required: true },
  contact: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, required: true }
  // add other fields if needed
}, { strict: true }); // ✅ Force strict mode

module.exports=mongoose.model("Student",studentSchema)
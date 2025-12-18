const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema({
  name: String,
  code: String,
  credits: Number
});

const CurriculumSchema = new mongoose.Schema({
  className: String,
  department: String,
  totalSemesters: Number,
  effectiveYear: String,
  semesterData: {
    type: Map,
    of: [CourseSchema]
  },
  totalCredits: Number,
  uploadedAt: Number
}, { strict: true });

module.exports = mongoose.model("Curriculum", CurriculumSchema);

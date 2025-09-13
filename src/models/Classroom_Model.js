const mongoose = require("mongoose");

const classroomSchema = new mongoose.Schema({
  number: { type: String, required: true, unique: true }, // Classroom number/name
  polygon: {
    type: {
      type: String,
      enum: ["Polygon"],
      required: true
    },
    coordinates: {
      type: [[[Number]]], // Array of arrays of [lng, lat]
      required: true
    }
  }
});

// Enable geospatial queries
classroomSchema.index({ polygon: "2dsphere" });

module.exports = mongoose.model("Classroom", classroomSchema);
const Classroom = require("../models/Classroom_Model");

exports.create = async (req, res) =>{
    try {
    const { number, polygon } = req.body;

    if (!number || !polygon) {
      return res.status(400).json({ success: false, message: "Classroom number and polygon are required" });
    }

    // Ensure polygon is closed (first == last point)
    const coords = polygon.coordinates[0];
    if (
      coords.length < 4 ||
      coords[0][0] !== coords[coords.length - 1][0] ||
      coords[0][1] !== coords[coords.length - 1][1]
    ) {
      return res.status(400).json({ success: false, message: "Polygon must be closed (first and last coordinates must match)" });
    }

    const classroom = new Classroom({ number, polygon });
    await classroom.save();

    res.status(201).json({ success: true, message: "Classroom created successfully", classroom });
  } catch (err) {
    console.error("❌ Error creating classroom:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.details = async (req, res) =>{
    try {
    const classrooms = await Classroom.find();
    res.status(200).json(classrooms);
  } catch (err) {
    console.error("❌ Error fetching classrooms:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
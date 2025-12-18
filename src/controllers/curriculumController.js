const Curriculum = require("../models/Curriculum_Model");

exports.uploadCurriculum = async (req, res) => {
  try {
    const curriculum = new Curriculum(req.body);
    await curriculum.save();

    res.json({ success: true, message: "Curriculum saved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getCurriculumSummary = async (req, res) => {
  try {
    const summary = await Curriculum.find({}, {
      className: 1,
      department: 1,
      effectiveYear: 1
    });

    res.json({
      success: true,
      count: summary.length,
      summary
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.getCurriculum = async (req, res) => {
  try {
    const { className, department, effectiveYear } = req.query;

    let query = {};

    if (className) query.className = className;
    if (department) query.department = department;
    if (effectiveYear) query.effectiveYear = effectiveYear;

    const curriculums = await Curriculum.find(query);

    res.json({
      success: true,
      count: curriculums.length,
      curriculums
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.createCurriculum = async (req, res) => {
  console.log("Curriculum create payload:", req.body);
  try {
    console.log("Curriculum create payload:", req.body);
    const curriculum = new Curriculum(req.body);
    await curriculum.save();

    res.json({
      success: true,
      message: "Curriculum created successfully"
    });
  } catch (err) {
    console.error("Error creating curriculum:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

exports.getCurriculumById = async (req, res) => {
  try {
    const { id } = req.params;

    const curriculum = await Curriculum.findById(id);

    if (!curriculum) {
      return res.status(404).json({
        success: false,
        message: "Curriculum not found"
      });
    }

    res.json({
      success: true,
      curriculum
    });

  } catch (err) {
    console.error("Error fetching curriculum:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateCurriculum = async (req, res) => {
  try {
    console.log("Curriculum update payload:", req.body);
    const { id } = req.params;

    const updated = await Curriculum.findByIdAndUpdate(
      id,
      req.body,
      { new: true }   // return updated doc
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Curriculum not found"
      });
    }

    res.json({
      success: true,
      message: "Curriculum updated successfully",
      curriculum: updated
    });

  } catch (err) {
    console.error("Error updating curriculum:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

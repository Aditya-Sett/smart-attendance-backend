const Student = require('../models/Student_Model');

exports.login = async (req, res) => {
  const { email, password, expectedRole } = req.body;

  try {
    if (!email || !password || !expectedRole) {
      return res.status(400).json({ success: false, message: "Missing credentials" });
    }

    const user = await Student.findOne({
      $or: [{ email }, { studentId: email }]
    });

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.password !== password) return res.status(401).json({ success: false, message: "Invalid password" });

    if (user.role !== expectedRole) return res.status(403).json({ success: false, message: `Access denied for role ${expectedRole}` });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      role: user.role,
      id: user.studentid,
      department: user.department
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

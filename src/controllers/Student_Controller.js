const Student=require('../models/Student_Model')

exports.getStudentsByDepartment= async(req,res)=>{
    try {
        const { department } = req.params;

        if (!department) {
            return res.status(400).send("Department is required");
        }

        const students = await Student.find({ department });

        if (students.length === 0) {
            return res.status(404).send("No students found for this department");
        }

        /*const students = await Student.find({ department }).lean();

        if (!students.length) {
            return res.status(404).send("No students found for this department");
        }*/

        // Send raw array directly (no strict model needed)
        res.send(students);
        //res.status(200).json(students);

    } catch (error) {
        console.error("Error fetching students by department:", error);
        res.status(500).send("Server error");
    }
};
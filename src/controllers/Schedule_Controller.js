const Schedule=require('../models/Schedule_Model')

exports.getScheduleByDepartment= async(req,res)=>{
    const schedules=await Schedule.find({ department: req.params.department});
    res.json(schedules);
};

exports.addSchedule= async (req, res) => {
  console.log("✅ Incoming Schedule Fields:");
  console.log("department:", req.body.department);
  console.log("day:", req.body.day);
  console.log("time:", req.body.time);
  console.log("subject:", req.body.subject);
  console.log("room:", req.body.room);
  console.log("group:", req.body.group);

  try {
    const schedule = new Schedule(req.body);
    await schedule.save();
    console.log("✅ Saved Schedule:", schedule);
    res.status(201).json(schedule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
const dayjs=require('dayjs');
const timezone = require('dayjs/plugin/timezone');
dayjs.extend(timezone);
exports.health_check = (req,res) => {
    return res.status(201).json({
          success: true,
          message: "Server is up",
          time_stamp: dayjs(new Date()).tz("Asia/Kolkata").format("DD-MM-YYYY hh:mm:ss A")
        });
}
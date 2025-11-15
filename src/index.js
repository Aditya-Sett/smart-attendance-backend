
require('dotenv').config();

const express = require('express');
const app = express();

const PORT = process.env.PORT || 5000;             //Port 
const connectDB=require('./config/DbConnection');  //MongoDb connection

const scheduleRoutes=require('./routes/Schedule_Routes');
const attendenceRoutes=require('./routes/Attendence_Routes');
const authRoutes=require('./routes/Auth_Routes');
const classroomsRoutes=require('./routes/classrooms_Routes');
//Student_Routes
const studentRoutes=require('./routes/Student_Routes');

const { SMART_ATTENDENCE_SETVER_RUN, SERVER_RUNNING } = require('./constants/Message_Contants');

const DailyCodeCleanupScheduler=require("./utils/DailyCodeCleanUpScheduler");
const schedulerRoutes = require('./routes/SchedulerRoutes');

// MongoDB connection
connectDB();

app.use(express.json());

// Initialize scheduler
const dailyCleanupScheduler = new DailyCodeCleanupScheduler();

// Start the scheduler when your app starts
dailyCleanupScheduler.start();

app.use('/api/schedule',scheduleRoutes);

app.use('/api/attendance',attendenceRoutes);

app.use('/api/auth',authRoutes);

app.use('/api/students',studentRoutes);

app.use('/api/classrooms',classroomsRoutes);

// Use scheduler routes
app.use('/api/scheduler', schedulerRoutes);


app.get('/', (req, res) => {
  res.send(`${SMART_ATTENDENCE_SETVER_RUN}`);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`${SERVER_RUNNING} ${PORT}`);
});

// Make scheduler available globally if needed
global.dailyCleanupScheduler = dailyCleanupScheduler;
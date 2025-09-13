
require('dotenv').config();

const express = require('express');
const app = express();

const PORT = process.env.PORT || 5000;             //Port 
const connectDB=require('./config/DbConnection');  //MongoDb connection

const scheduleRoutes=require('./routes/Schedule_Routes');
const attendenceRoutes=require("./routes/Attendence_Routes");
const authRoutes=require('./routes/Auth_Routes');
const classroomsRoutes=require('./routes/classrooms_Routes');
//Student_Routes
const studentRoutes=require('./routes/Student_Routes');

const { SMART_ATTENDENCE_SETVER_RUN, SERVER_RUNNING } = require('./constants/Message_Contants');


// MongoDB connection
connectDB();

app.use(express.json());


app.use('/api/schedule',scheduleRoutes);

app.use('/api/attendance',attendenceRoutes);

app.use('/api/auth',authRoutes);

app.use('/api/students',studentRoutes);

app.use('/api/classrooms',classroomsRoutes);


app.get('/', (req, res) => {
  res.send(`${SMART_ATTENDENCE_SETVER_RUN}`);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`${SERVER_RUNNING} ${PORT}`);
});
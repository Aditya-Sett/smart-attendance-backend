const mongoose=require('mongoose')

const connectDB = async () => {
  try {

    const options = {
      // maintain up to 200 socket connections (Default is 10)
      maxPoolSize: 400, 
      // keep at least 10 connections open
      minPoolSize: 10,  
      // how long the MongoDB driver will wait before timing out a query
      socketTimeoutMS: 45000, 
      // helps with connectivity on slow free-tier networks
      serverSelectionTimeoutMS: 5000,
      // wait time for a connection to become available from the pool
      waitQueueTimeoutMS: 5000, 
    };

    await mongoose.connect(`${process.env.MONGO_URI}`, options);
    console.log('Connected MongoDb');
  } catch (err) {
    console.error(err);
    console.error('MongoDb Connection Failed ');

    process.exit(1); // gracefully exit
  }
};

module.exports=connectDB;
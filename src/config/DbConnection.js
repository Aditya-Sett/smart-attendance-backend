const mongoose=require('mongoose')

const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGO_URI}`);
    console.log('Connected MongoDb');
  } catch (err) {
    console.error(err);
    console.error('MongoDb Connection Failed ');

    process.exit(1); // gracefully exit
  }
};

module.exports=connectDB;
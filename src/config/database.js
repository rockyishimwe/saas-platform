const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () =>{
    try{
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser:true,
            useUnifiedTopology:true
        });
        logger.info(`MongoDB Connected:${conn.connection.host}`);
    }catch (error) {
        logger.error('Database connection failed:',error.message);
        process.exit(1);
    }
};
mongoose.connection.on('connected',() =>{
    logger.info('Mongoose connected to MongoDB');
});
mongoose.connection.on('error',(err)=>{
    logger.error('Mongoose disconnected error:',err);
});
mongoose.connection.on('disconnected',() =>{
    logger.info('Mongoose disconnected');
});

process.on('SIGINT',async () =>{
    await mongoose.connection.close();
    logger.info('MongoDB connection closed through app termination');
    process.exit(0);
});
module.exports = connectDB;
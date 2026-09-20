import mongoose from 'mongoose';
import dns from 'dns';

// Fix for Node c-ares DNS resolver failing SRV queries on local ISP/router DNS
dns.setServers(['8.8.8.8', '8.8.4.4']);

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}. Server will continue running without DB.`);
    // process.exit(1);
  }
};

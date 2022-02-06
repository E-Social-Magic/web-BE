import env from 'dotenv';
env.config();
export default {
  API_PORT: process.env.API_PORT,
  MONGO_URI: process.env.MONGO_URI,
};


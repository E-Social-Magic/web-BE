import env from 'dotenv';
env.config();
export default {
  API_PORT: process.env.API_PORT,
  MONGO_URI: process.env.MONGO_URI,
  TOKEN_KEY: process.env.TOKEN_KEY,
  PARTNER_CODE: process.env.PARTNER_CODE,
  ACCESS_KEY: process.env.ACCESS_KEY,
  SECRET_KEY:process.env.SECRET_KEY,
  API_MOMO:process.env.API_MOMO,
};


import mongoose from 'mongoose';
import User from './user.js'
mongoose.Promise= global.Promise

const db = {
    mongoose,
    User
}

export default db;
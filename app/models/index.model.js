import mongoose from 'mongoose';
import User from './user.js';
import Group from './group.js';
import Post from './post.js';
import Payment from './payment.js';

mongoose.Promise= global.Promise

const db = {
    mongoose,
    User,
    Post,
    Group,
    Payment,
}

export default db;
import mongoose from 'mongoose';
import User from './user.js';
import Group from './group.js';
import Post from './post.js';
import Private_data from './private_data.js';

mongoose.Promise= global.Promise

const db = {
    mongoose,
    User,
    Post,
    Group,
    Private_data
}

export default db;
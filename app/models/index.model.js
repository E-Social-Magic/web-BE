import mongoose from 'mongoose';
import User from './user.js';
import Group from './group.js';
import Post from './post.js';
import Comment from './comment.js';

mongoose.Promise= global.Promise

const db = {
    mongoose,
    User,
    Post,
    Comment,
    Group
}

export default db;
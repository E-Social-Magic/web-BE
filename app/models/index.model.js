import mongoose from 'mongoose';
import User from './user.js';
import Group from './group.js';
import Post from './post.js';
import Comment from './comment.js';
import Subject from './subject.js';
import Private_data from './private_data.js';

mongoose.Promise= global.Promise

const db = {
    mongoose,
    User,
    Post,
    Comment,
    Group,
    Subject,
    Private_data
}

export default db;
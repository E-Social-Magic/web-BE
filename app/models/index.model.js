import mongoose from 'mongoose';

mongoose.Promise= global.Promise

const db = {
    mongoose,
}

export default db;
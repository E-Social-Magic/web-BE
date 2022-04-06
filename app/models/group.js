import mongoose from 'mongoose';

const schema = new mongoose.Schema(
    {
        group_name: { type: String, required: true, maxLength: 100 },
        subject: {type: String, required: true },
        user_id: { type: String, required: false},
        users: { type: Array, required: false, default: []},
        posts: { type: Array, required: false, default: []},
        avatar: { type: String, required: false },
        private: { type: Boolean, default: false, required: false },
        blocked: { type: Boolean, default: false, required: false }
    },
    { timestamps: true }
);

schema.index({ group_name: 'text', subject: 'text' });

schema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

export default mongoose.model('group', schema);
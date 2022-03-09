import mongoose from 'mongoose';

const schema = new mongoose.Schema(
    {
        group_name: { type: String, required: true, maxLength: 100 },
        subject: {type: String, required: true },
        private_dt: { type: Array, required: false, default: []},
        user_id: { type: Array, required: false, default: []},
        avatar: { type: String, required: true },
        visible: { type: Number, default: 0, required: false }
    },
    { timestamps: true }
);

schema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

export default mongoose.model('group', schema);
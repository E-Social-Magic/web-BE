import mongoose from 'mongoose';

const schema = new mongoose.Schema(
    {
        name: { type: String, required: true, maxLength: 100 },
    },
    { timestamps: true }
);

schema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

export default mongoose.model('subject', schema);
import mongoose from 'mongoose';

const schema = new mongoose.Schema(
    {
        requestId: {type: String, required: true },
        orderId: {type: String, required: true },
        amount: {type: String, required: true },
        responseTime: {type: String, required: true },
        message: {type: String, required: true },
        resultCode: {type: String, required: true },
        user_id: {type: String, required: true },
        username: {type: String, required: true }
    },
    { timestamps: true }
);

schema.index({ message: 'text', resultCode: 'text', username: 'text' });

schema.method('toJSON', function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

export default mongoose.model('payment', schema);
import mongoose from 'mongoose';

const schema = new mongoose.Schema(
    {
        requestId: { type: String, required: true, unique: true },
        orderId: { type: String, required: true },
        amount: { type: Number, required: true },
        phone: { type: String, required: false },
        accountBalance: { type: Number, required: true },
        message: { type: String, required: true },
        resultCode: { type: String, required: true },
        user_id: { type: String, required: true },
        username: { type: String, required: true },
        displayName: { type: String, required: false },
        type: { type: String, required: true, enum: ['in', 'out'] },
        typeTransfer: { type: String, required: true, enum: ['momo', 'coins'] },
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
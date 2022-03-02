import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    post_id: { type: Number, required: true },
    user_id: { type: Number, required: true },
    visible: { type: Number, default: 0, required: false }
  },
  { timestamps: true }
);

schema.method('toJSON', function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

export default mongoose.model('comment', schema);
import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    post_id: { type: Int32Array, required: true },
    user_id: { type: Int32Array, required: true },
    visible: { type: Int32Array, required: true }
  },
  { timestamps: true }
);

schema.method('toJSON', function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

export default mongoose.model('comment', schema);
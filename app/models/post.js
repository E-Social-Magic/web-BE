import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxLength: 100 },
    content: { type: String, required: true },
    img: { type: String, required: true },
    user_id: { type: Number, required: true },
    visible: { type: Number, required: true },
  },
  { timestamps: true }
);

schema.method('toJSON', function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

export default mongoose.model('post', schema);
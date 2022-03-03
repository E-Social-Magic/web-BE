import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, minLength: 3, maxLength: 100 },
    role: { type: Object, required: true },
    type: { type: String, required: true, minLength: 3, maxLength: 100 }
  },
  { timestamps: true }
);

schema.method('toJSON', function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

export default mongoose.model('private_data', schema);
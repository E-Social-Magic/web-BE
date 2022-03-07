import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    username: { type: String, required: true, maxLength: 100 },
    email: { type: String, required: false, maxLength: 100 },
    password: { type: String, required: false, minLength: 6 },
    googleID: { type: String, required: false },
    facebookID: { type: String, required: false },
    subjects: {type: Array, required: false},
    visible: { type: Number, default: 0, required: false },
    role: { type: String, required: true, enum: ['admin', 'user']}
  },
  { timestamps: true }
);

schema.method('toJSON', function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

export default mongoose.model('users', schema);
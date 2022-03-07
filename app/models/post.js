import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxLength: 100 },
    content: { type: String, required: true },
    images: { type: Array, required: false },
    videos: { type: Array, required: false },
    user_id: { type: String, required: true },
    visible: { type: Number, default: 0, required: false },
    comments: {type: Array, default: [], required: false},
    votes: {type:Number, required:false, default: 0},
    voteups:{type:Array,required:false,default:[]},
    votedowns:{type:Array,required:false,default:[]}

  },
  { timestamps: true }
);

schema.method('toJSON', function () {
  const { __v, _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

export default mongoose.model('post', schema);
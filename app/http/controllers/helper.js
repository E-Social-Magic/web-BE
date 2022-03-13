import db from '../../models/index.model.js';
const { User, Post, Group } = db;
import mongoose from 'mongoose';
var ObjectId = mongoose.Types.ObjectId;
// Tìm câu hỏi, post tính phí 

// Check nếu câu hỏi tính phí + cmt đã tích correct => chuyền tiền 
export const transfers = async (req, res) =>{
    try {
        const commentID =  new ObjectId(req.params.commentId);
        const post = Post.findOne({
            _id: req.params.id, 
            "comments.user_id": req.user.user_id, //User đang đăng nhập 
            "comments._id": commentID, 
            "comments.correct": true,
            costs: true
        });
        if(post){
            const user = await User.findById({_id: req.user.user_id});
            const coinsAfterAnswer = user.coins + post.coins;
            await User.findByIdAndUpdate(
                { _id: req.user.user_id },
                { coins: coinsAfterAnswer }
            );
            await Post.findByIdAndUpdate(
                {_id: req.params.id},
                { coins: 0}
                )
            return res.json({coinsPost: post.coins, coinsHelper: user.coins})
        }
        return res.status(403).json({
            message: `Cannot update user with id=${req.params.id}. Maybe user was not found or No permission!`,
        });
    } catch (error) {
        return res.status(500).json({
                message: `Error: ${error}`,
            });
    }
}
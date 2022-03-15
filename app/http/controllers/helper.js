import db from '../../models/index.model.js';
const { User, Post, Group } = db;
import mongoose from 'mongoose';
var ObjectId = mongoose.Types.ObjectId;
// Tìm câu hỏi, post tính phí 

// Check nếu câu hỏi tính phí + cmt đã tích correct => chuyền tiền 
export const transfers = async (req, res) => {
    try {
        const commentID = new ObjectId(req.params.commentId);
        const post = await Post.findOne({
            _id: req.params.id,
            "comments.user_id": req.user.user_id, //User đang đăng nhập 
            "comments._id": commentID,
            "comments.correct": true,
            costs: true
        });
        if (post) {
            const user = await User.findById({ _id: req.user.user_id });
            const coinsOfOwner = (10/100)* post.coins;
            const coinsOfHelper = user.coins + (post.coins - coinsOfOwner);
            await User.findByIdAndUpdate(
                { _id: req.user.user_id },
                { coins: coinsOfHelper }
            );
            await User.findByIdAndUpdate(
                { _id: post.user_id },
                { coins: coinsOfOwner }
            );
            await Post.findByIdAndUpdate(
                { _id: req.params.id },
                { costs: false }
            )
            return res.json({ coinsPost: post.coins, coinsHelper: user.coins, coinsOfOwner: coinsOfOwner })
        }
        return res.status(403).json({
            message: `Không thể nhận tiền từ bài post có id=${req.params.id}. Có thể bạn đã nhận tiền rồi hoặc bạn không phải người trả lời đúng!`,
        });
    } catch (error) {
        return res.status(500).json({
            message: `Error: ${error}`,
        });
    }
}

// Check coi post có pải bài post tính tiền 
// Check cmt có được đánh dấu là đánh dấu hay chưa 
// Tìm tk user cmt đó
// Chuyển tiền 
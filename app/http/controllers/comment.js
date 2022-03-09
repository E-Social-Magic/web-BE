import db from '../../models/index.model.js';
const { Post, User } = db;
import mongoose from 'mongoose';
var Schema = mongoose.Schema;
var ObjectIdSchema = Schema.ObjectId;
var ObjectId = mongoose.Types.ObjectId;
import _ from 'lodash';
import multer from 'multer';
import { storageImages } from '../../../config/multer.js';
const uploadImage = multer({ storage: storageImages, 
    fileFilter: function (req, file, done) {
        var ext = path.extname(file.originalname);
        if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
            return done(new Error('Only images are allowed'))
        }
        done(null, true)
      }
});

export const createComment = [
    uploadImage.array("files"),
    async (req, res) => {
        try {
            const post = await Post.findOneAndUpdate(
                { _id: req.params.id },
                {
                    $push: {
                        comments: {
                            _id: new ObjectId(),
                            comment: req.body.comment,
                            user_id: req.user,
                            images: req.files.map((file) => file.path)
                        }
                    }
                },
                { returnOriginal: false }
            );
    
            if (post)
                return res.json({ post, message: 'Comment successfully.' });
            return res.status(403).json({
                message: `Cannot Comment with id=${req.params.id}. Maybe post was not found or No permission!`,
            });
        } catch (error) {
            return res.status(500).json({
                message: `Error updating post with id= ${error}`,
            });
        }
    }
]

export async function editComment(req, res) {
    try {
        const commentID = new ObjectId(req.params.commentId);
        const posts = await Post.findOneAndUpdate(
            { _id: req.params.id, "comments.user_id": req.user, "comments._id": commentID },
            {
                $set: {
                    "comments.$.comment": req.body.comment,
                }
            },
            {passRawResult : true, returnOriginal: false }
        );
        if (_.find(posts.comments,{_id:commentID,comment:req.body.comment}))
            return res.json({ posts, message: 'Comment successfully.' });
        return res.status(403).json({
            message: `Cannot Comment with id=${req.params.id}. Maybe post was not found or No permission!`,
        });
    } catch (error) {
        return res.status(500).json({
            message: `Error updating post with id= ${error}`,
        });
    }
}

export async function deleteComment(req, res) {
    try {
        const commentID = new ObjectId(req.params.commentId);
        const post = await Post.findOneAndUpdate(
            { _id: req.params.id, user_id: req.user },
            { $pull: { "comments": {_id: commentID}}},
            { returnOriginal: false }
        );
        if (post)
            return res.json({ post, message: 'Delete successfully.' });
        return res.status(403).json({
            message: `Cannot Comment with id=${commentID}. Maybe post was not found or No permission!`,
        });
    } catch (error) {
        return res.status(500).json({
            message: `Error: ${error}`,
        });
    }

}

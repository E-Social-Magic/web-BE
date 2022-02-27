import db from '../../models/index.model.js';
const { Comment } = db;
import { check, body, validationResult } from 'express-validator';
import storage from 'node-persist';

export function listComment(req, res) {
    const col = 'content comment_id user_id visible updated'
    Comment.find({}, col, (err, comments) => {
        if (err) { return res.json({ err }) }
        res.json({ comments: comments })
    })
}

export function detailComment(req, res) {
    Comment.findById(req.params.id).populate('user_id').exec(function (err, comment) {
        if (err) { return res.json({ err }) }
        res.json({
            content: comment.content,
            comment_id: comment.comment_id,
            user_id: comment.user_id.username,
            visible: comment.visible
        })
    })
}

export const createComment = [
    body('content', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('comment_id', 'Content must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('visible', 'Visible must not be empty.').trim().isLength({ min: 1 }).escape(),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.json({ comment: req.body, errors: errors.array() });
            return;
        }
        else {
            const comment = new Comment(req.body)
            comment.user_id = req.session.user._id
            comment.save().then(result => {
                res.json({ comment: result })
            })
        }
    }
]
export const editComment = [
    body('content', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('comment_id', 'Content must not be empty.').trim().isLength({ min: 1 }).escape(),
    body('visible', 'Visible must not be empty.').trim().isLength({ min: 1 }).escape(),
    (req, res) => {
        Comment.findById(req.params.id, 'content comment_id', (err, comment) => {
            if (err) { return res.json({ err }) }
            comment.content = req.body.content
            comment.comment_id = req.body.comment_id
            comment.save().then(result => {
                res.json({ comment: result })
            })
        })
    }
]


export function deleteComment(req, res) {
    Comment.remove({ _id: req.params.id }, (err) => {
        if (err) { return res.json({ err }) }
        res.json({ 'mess': 'Delete success' })
    })
}
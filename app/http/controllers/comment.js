import db from '../../models/index.model.js';
const { Comment } = db;
import { check, body, validationResult } from 'express-validator';

export function listComment(req, res) {
    Comment.find({}, (err, comments) => {
        if (err) { return res.json({ err }) }
        return res.json({ comments: comments })
    })
}

export function detailComment(req, res) {
    Comment.findById(req.params.id).populate('user_id').exec(function (err, comment) {
        if (err) { return res.json({ err }) }
        return res.json({
            content: comment.content,
            post_id: comment.post_id,
            user_id: comment.user_id,
            visible: comment.visible
        })
    })
}

export const createComment = [
    body('content', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    (req, res) => {
        const errors = validationResult(req);
        const comment = new Comment(req.body)

        if (!errors.isEmpty()) {
            return res.json({ comment: req.body, errors: errors.array() });
        }
        else {
            // comment.user_id = req.session.user._id
            comment.save().then(result => {
                return res.json({ comment: result })
            })
        }
    }
]
export const editComment = [
    body('content', 'Title must not be empty.').trim().isLength({ min: 1 }).escape(),
    (req, res) => {
        Comment.findById(req.params.id, 'content post_id', (err, comment) => {
            if (err) { return res.json({ err }) }
            comment.content = req.body.content
            comment.save().then(result => {
                return res.json({ comment: result })
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
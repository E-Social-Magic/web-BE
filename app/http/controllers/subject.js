import db from '../../models/index.model.js';
const { User, Group } = db;
import mongoose from 'mongoose';
var Schema = mongoose.Schema;
import _ from 'lodash';

export const createSubject = [
    async (req, res) => {
        try {
            if(!(req.body.subjects instanceof Array)){
                return res.status(400).end();
            }
            const groups = await Group.find({ _id: req.body.subjects });
            const arr = groups.map(group => group._id);
            await Group.updateMany(
                { _id:{$in: arr}},
                {
                 $push: {user_id: req.user.user_id}
                },
                { returnOriginal: false }
            )
            const user = await User.findOneAndUpdate(
                    { _id: req.user.user_id },
                    {
                    subjects: arr
                    },
                    { returnOriginal: false }
                );
            
            if(user) 
                return res.json({ subjects: user.subjects, message: 'Add subject successfully.' });
            return res.status(403).json({
                message: `Cannot add subject at user_id=${req.user.user_id}. Maybe user was not found or No permission!`,
            });

        } catch (error) {
            return res.status(500).json({
                message: `Error: ${error}`,
            });
        }
    }
]

export async function editSubject(req, res) {
    try {
        if(!(req.body.subjects instanceof Array)){
            return res.status(400).end();
        }
        const groups = await Group.find({ _id: req.body.subjects });
        const arr = groups.map(group => group._id);
        await Group.updateMany(
            { _id:{$in: arr}},
            {
             $push: {user_id: req.user.user_id}
            },
            { returnOriginal: false }
        )
        const user = await User.findOneAndUpdate(
                { _id: req.user.user_id },
                {
                    $push: {subjects: arr}
                },
                { returnOriginal: false }
            );
        
        if(user)
            return res.json({ subjects: user.subjects, message: 'Subject successfully.' });
        return res.status(403).json({
            message: `Cannot edit subject at id=${subjectID}!`,
        });
    } catch (error) {
        return res.status(500).json({
            message: `Error: ${error}`,
        });
    }
}

export async function deleteSubject(req, res) {
    try {
        if(!(req.body.subjects instanceof Array)){
            return res.status(400).end();
        }
        const groups = await Group.find({ _id: req.body.subjects });
        const arr = groups.map(group => group._id);
        await Group.updateMany(
            { _id:{$in: arr}},
            {
             $pull: {user_id: req.user.user_id}
            },
            { returnOriginal: false }
        )
        const user = await User.findOneAndUpdate(
                { _id: req.user.user_id },
                {
                    $pull: {subjects: arr}
                },
                { returnOriginal: false }
            );
        if (user)
            return res.json({ subjects: user.subjects, message: 'Delete successfully.' });
        return res.status(403).json({
            message: `Cannot delete subject at id=${subjectID}`,
        });
    } catch (error) {
        return res.status(500).json({
            message: `Error: ${error}`,
        });
    }

}

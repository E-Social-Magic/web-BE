import db from '../../models/index.model.js';
const { User } = db;
import mongoose from 'mongoose';
var Schema = mongoose.Schema;
var ObjectIdSchema = Schema.ObjectId;
var ObjectId = mongoose.Types.ObjectId;
import _ from 'lodash';

export const createSubject = [
    async (req, res) => {
        try {
            const user = await User.findOneAndUpdate(
                { _id: req.params.id },
                {
                    $push: {
                        subjects: {
                            _id: new ObjectId(),
                            subject: req.body.subject,
                        }
                    }
                },
                { returnOriginal: false }
            );

            if (user)
                return res.json({ subjects: user.subjects, message: 'Add subject successfully.' });
            return res.status(403).json({
                message: `Cannot add subject at user_id=${req.params.id}. Maybe user was not found or No permission!`,
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
        const subjectID = new ObjectId(req.params.subjectId);
        const user = await User.findOneAndUpdate(
            { _id: req.params.id, "subjects._id": subjectID },
            {
                $set: {
                    "subjects.$.subject": req.body.subject,
                }
            },
            { passRawResult: true, returnOriginal: false }
        );
        if (_.find(user.subjects, { _id: subjectID, subject: req.body.subject }))
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
        const subjectID = new ObjectId(req.params.subjectId);
        const user = await User.findOneAndUpdate(
            { _id: req.params.id, user_id: req.session.passport.user },
            { $pull: { "subjects": { _id: subjectID } } },
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

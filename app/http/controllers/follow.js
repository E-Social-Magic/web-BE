import db from '../../models/index.model.js';
const { User } = db;
var success= "Hoàn thành";

export const follow = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const ownerId = req.params.id;
        const follow = req.query.follow;
        // case 1 neu query up =true
        const user = await User.findOne({_id: userId}, { password: 0, role: 0 });
        const ownerUser = await User.findById({_id: ownerId}, { password: 0, role: 0 });
        //case 1 thiếu query
        if (!follow) {
            return res.json("Nothing to do")
        }
        // case 2 neu query up = true
        if (follow == "true") {
            if (user.following.includes(ownerId)) {
                // xoa user do ra khoi array
                await User.findByIdAndUpdate(
                    { _id: ownerId },
                    {
                        $pull: {
                            "follower": userId
                        }
                    },
                    { returnOriginal: false }
                );
                await User.findByIdAndUpdate(
                    { _id: userId },
                    {
                        $pull: {
                            "following": ownerId
                        }
                    },
                    { returnOriginal: false }
                );
            } else {
                //them user do vao array
                await User.findByIdAndUpdate(
                    { _id: ownerId },
                    {
                        $push: {
                            "follower": userId
                        }
                    },
                    { returnOriginal: false }
                );
                await User.findByIdAndUpdate(
                    { _id: userId },
                    {
                        $push: {
                            "following": ownerId
                        }
                    },
                    { returnOriginal: false }
                );
            }
        }
        return res.json({ user, ownerUser, message: success });
    } catch (error) {
        return res.status(500).json({
            message: `Error: ${error}`,
        });
    }
}

export const listFollower = async (req, res) => {
    try {
        
    } catch (error) {
        return res.status(500).json({
            message: `Error: ${error}`,
        });
    }
}

export const listFollowing = async (req, res) => {
    try {
        
    } catch (error) {
        return res.status(500).json({
            message: `Error: ${error}`,
        });
    }
}
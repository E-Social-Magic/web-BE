import db from '../../models/index.model.js';
const { User } = db;

export const follow = async (req, res) => {
    try {
        /* Khi ấn follow 
        -> gửi req.query 
        -> add req.user.user_id to follower of user kia và add user_id của nó to follwing of req.user.user_id */
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
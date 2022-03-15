var userArgs = process.argv.slice(2);

import db from './app/models/index.model.js';
const { Post, User, Group } = db;
import async from "async";
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
var mongoDB = userArgs[0];
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = global.Promise;
var database = mongoose.connection;
database.on('error', console.error.bind(console, 'MongoDB connection error:'));

var users = []
var posts = []
var groups = []

function userCreate(username, password, email, avatar, cb) {
    bcrypt.hash(password, 10, (err, hash) => {
        var user = new User({
            username: username,
            password: hash,
            email: email,
            avatar: avatar,
            role: "user"
        });

        user.save(function (err) {
            if (err) {
                cb(err, null)
                return
            }
            users.push(user)
            cb(null, user)
        });
    });
}

function postCreate(title, content, user_id, username, cb) {
    var post = new Post({ title: title, content: content, user_id: user_id, username: username });
    post.save(function (err) {
        if (err) {
            cb(err, null);
            return;
        }
        posts.push(post)
        cb(null, post);
    });
}

function groupCreate(group_name, subject, image, cb) {
    var group = new Group({
        group_name: group_name,
        subject: subject,
        avatar: image
    });
    group.save(function (err) {
        if (err) {
            cb(err, null)
            return
        }
        groups.push(group)
        cb(null, group)
    });
}

function createGroupAuthors(cb) {
    async.series([
        function (callback) {
            userCreate('Tanjiro', '123456', 'tojro1@gmail.com', 'https://static.wikia.nocookie.net/kimetsu-no-yaiba/images/f/f9/Tanjiro_Anime_Profile.png/revision/latest/scale-to-width-down/98?cb=20191224040903', callback);
        },
        function (callback) {
            userCreate('Inosuke', '123456', 'tojro2@gmail.com', 'https://static.wikia.nocookie.net/kimetsu-no-yaiba/images/4/46/Zenitsu_Anime_Profile.png/revision/latest/scale-to-width-down/98?cb=20191125204606', callback);
        },
        function (callback) {
            userCreate('Zenitsu', '123456', "tojro3@gmail.com", 'https://static.wikia.nocookie.net/kimetsu-no-yaiba/images/c/c2/Inosuke_Anime_Profile.png/revision/latest/scale-to-width-down/98?cb=20191125204712', callback);
        },
        function (callback) {
            groupCreate("Toán", "Toán", "http://web-be-brmc9.ondigitalocean.app/uploads/avatar-1646899596146.jpg", callback);
        },
        function (callback) {
            groupCreate("Văn", "Văn", "http://web-be-brmc9.ondigitalocean.app/uploads/avatar-1646900546116.png", callback);
        },
        function (callback) {
            groupCreate("Anh", "Anh", "http://web-be-brmc9.ondigitalocean.app/uploads/avatar-1646900373484.png", callback);
        },
        function (callback) {
            groupCreate("Lí", "Lí", "http://web-be-brmc9.ondigitalocean.app/uploads/avatar-1646899690171.jpg", callback);
        },
        function (callback) {
            groupCreate("Hóa", "Hóa", "http://web-be-brmc9.ondigitalocean.app/uploads/avatar-1646899626002.jpg", callback);
        },
        function (callback) {
            groupCreate("Sinh", "Sinh", "http://web-be-brmc9.ondigitalocean.app/uploads/avatar-1646899657602.jpg", callback);
        },
        function (callback) {
            groupCreate("Sử", "Sử", "http://web-be-brmc9.ondigitalocean.app/uploads/avatar-1646899714914.jpg", callback);
        },
        function (callback) {
            groupCreate("Địa", "Địa", "http://web-be-brmc9.ondigitalocean.app/uploads/avatar-1646899739205.jpg", callback);
        },
        function (callback) {
            groupCreate("GDCD", "GDCD", "http://web-be-brmc9.ondigitalocean.app/uploads/avatar-1646900601929.png", callback);
        },
        function (callback) {
            groupCreate("GDQP", "GDQP", "http://web-be-brmc9.ondigitalocean.app/uploads/avatar-1646900511139.png", callback);
        },
        function (callback) {
            groupCreate("Công nghệ", "Công nghệ", "http://web-be-brmc9.ondigitalocean.app/uploads/avatar-1646901612519.jpeg", callback);
        },
        function (callback) {
            groupCreate("Âm nhạc", "Âm nhạc", "http://web-be-brmc9.ondigitalocean.app/uploads/avatar-1646900192539.png", callback);
        },
        function (callback) {
            groupCreate("Mỹ thuật", "Mỹ thuật", "http://web-be-brmc9.ondigitalocean.app/uploads/avatar-1646900214148.png", callback);
        },
        function (callback) {
            groupCreate("Tin Học", "Tin học", "http://web-be-brmc9.ondigitalocean.app/uploads/avatar-1646900307612.png", callback);
        },
    ],
        cb);
}

function createPosts(cb) {
    async.parallel([
        function (callback) {
            postCreate('Toán', '(a^2 + b^2) = ?', users[0]._id, users[0].username, callback);
        },
        function (callback) {
            postCreate('Anh', 'Hello = ?', users[2]._id, users[2].username, callback);
        },
        function (callback) {
            postCreate('Toán', '1dm = ?cm', users[1]._id, users[1].username, callback);
        },
        function (callback) {
            postCreate('Toán', '1km = ?m', users[0]._id, users[0].username, callback);
        },
        function (callback) {
            postCreate('Toán', '(a^2 - b^2) = ?', users[2]._id, users[2].username, callback);
        },
        function (callback) {
            postCreate('Anh', 'What là gì?', users[1]._id, users[1].username, callback);
        },
        function (callback) {
            postCreate('Anh', 'Khi nào dùng When?', users[0]._id, users[0].username, callback);
        },
        function (callback) {
            postCreate('Sử', 'Ngày thành lập đảng là ngày bao nhiêu?', users[2]._id, users[2].username, callback);
        },
    ],
        cb);
}
async.series([
    createGroupAuthors,
    createPosts,
],
    function (err, results) {
        if (err) {
            console.log('FINAL ERR: ' + err);
        }
        else {
            console.log("Done");
        }
        mongoose.connection.close();
    });

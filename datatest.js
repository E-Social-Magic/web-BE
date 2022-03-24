var userArgs = process.argv.slice(2);

import db from './app/models/index.model.js';
const { Post, User, Group } = db;
import async from "async";
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { generateAvatar } from './app/http/controllers/generator.js';
var mongoDB = userArgs[0];
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = global.Promise;
var database = mongoose.connection;
database.on('error', console.error.bind(console, 'MongoDB connection error:'));

var users = []
var posts = []
var groups = []

function userCreate(username, password, email, avatar, cb) {
    if(avatar == ""){
        var uppercaseFirstLetter = username.charAt(0).toUpperCase();
        avatar = req.protocol + "://" + req.headers.host + generateAvatar(uppercaseFirstLetter, "avatarP").replace("./public", "");
    }
    bcrypt.hash(password, 10, (err, hash) => {
        var user = new User({
            username: username,
            password: hash,
            email: email,
            avatar: avatar,
            role: "user",
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

function postCreate(title, content, user_id, username, author_avatar, cb) {
    
    var post = new Post({ title: title, content: content, user_id: user_id, username: username, author_avatar: author_avatar });
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
    if(image == ""){
        var uppercaseFirstLetter = group_name.charAt(0).toUpperCase();
        image = req.protocol + "://" + req.headers.host + generateAvatar(uppercaseFirstLetter, "avatarG").replace("./public", "");
    }
    var group = new Group({
        group_name: group_name,
        subject: subject,
        avatar: image,
        user_id: listUsers
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
            userCreate('Tanjiro', '123456', 'tojro1@gmail.com', '', callback);
        },
        function (callback) {
            userCreate('Inosuke', '123456', 'tojro2@gmail.com', '', callback);
        },
        function (callback) {
            userCreate('Zenitsu', '123456', "tojro3@gmail.com", '', callback);
        },
        function (callback) {
            groupCreate("Toán", "Toán", "", callback);
        },
        function (callback) {
            groupCreate("Văn", "Văn", "", callback);
        },
        function (callback) {
            groupCreate("Anh", "Anh", "", callback);
        },
        function (callback) {
            groupCreate("Lí", "Lí", "", callback);
        },
        function (callback) {
            groupCreate("Hóa", "Hóa", "", callback);
        },
        function (callback) {
            groupCreate("Sinh", "Sinh", "", callback);
        },
        function (callback) {
            groupCreate("Sử", "Sử", "", callback);
        },
        function (callback) {
            groupCreate("Địa", "Địa", "", callback);
        },
        function (callback) {
            groupCreate("GDCD", "GDCD", "", callback);
        },
        function (callback) {
            groupCreate("GDQP", "GDQP", "", callback);
        },
        function (callback) {
            groupCreate("Công nghệ", "Công nghệ", "", callback);
        },
        function (callback) {
            groupCreate("Âm nhạc", "Nhạc", "", callback);
        },
        function (callback) {
            groupCreate("Mỹ thuật", "Mỹ thuật", "", callback);
        },
        function (callback) {
            groupCreate("Tin Học", "Tin học", "", callback);
        },
    ],
        cb);
}

function createPosts(cb) {
    async.parallel([
        function (callback) {
            postCreate('Toán', '(a^2 - b^2) = ?', users[2]._id, users[2].username, users[2].avatar, callback);
        },
        function (callback) {
            postCreate('Anh', 'What là gì?', users[1]._id, users[1].username, users[1].avatar, callback);
        },
        function (callback) {
            postCreate('Anh', 'Khi nào dùng When?', users[0]._id, users[0].username, users[0].avatar, callback);
        },
        function (callback) {
            postCreate('Sử', 'Ngày thành lập đảng là ngày bao nhiêu?', users[2]._id, users[2].username, users[2].avatar, callback);
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
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
    if (avatar == "") {
        var uppercaseFirstLetter = username.charAt(0).toUpperCase();
        avatar = "https://web-be-2-idkrb.ondigitalocean.app" + generateAvatar(uppercaseFirstLetter, "avatarP").replace("./public", "");
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

function postCreate(title, content, user_id, group_id, username, author_avatar, images=[], cb) {
    var post = new Post({
        title: title,
        content: content,
        user_id: user_id,
        username: username,
        author_avatar: author_avatar,
        group_id: group_id,
        images: images
    });
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
    // if (image == "") {
    //     var uppercaseFirstLetter = group_name.charAt(0).toUpperCase();
    //     image = "https://web-be-2-idkrb.ondigitalocean.app" + generateAvatar(uppercaseFirstLetter, "avatarG").replace("./public", "");
    // }
    var group = new Group({
        group_name: group_name,
        subject: subject,
        avatar: image,
        user_id: "62403b5c412079d656466c9f"
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
async function joinGroup(user_id, listGroups, cb) {
    try {
        const groups = await Group.find({ _id: { $in: listGroups } });
        const arr = groups.map(group => group._id.toString());
        await Group.updateMany(
            { _id: { $in: arr } },
            {
                $push: { users: user_id.toString() }
            },
            { returnOriginal: false }
        )
        const user = await User.findOneAndUpdate(
            { _id: user_id },
            {
                subjects: arr
            },
            { returnOriginal: false }
        );
        cb(null)
    } catch (error) {
        return console.log({ error });
    }
}
function createGroupAuthors(cb) {
    async.series([
        function (callback) {
            groupCreate("Toán Học", "Toán", "https://i.ibb.co/tP9k0Gx/t-i-xu-ng.jpg", callback);
        },
        function (callback) {
            groupCreate("Ngữ Văn", "Văn", "https://i.ibb.co/wR8gzMV/unsplash-Rg-Kmrxp-Ira-Y.png", callback);
        },
        function (callback) {
            groupCreate("Tiếng Anh", "Anh", "https://i.ibb.co/cwj2DQz/unsplash-vu-V25-Ofn-Ga8.png", callback);
        },
        function (callback) {
            groupCreate("Vật Lí", "Lí", "https://i.ibb.co/Mkv9kLq/t-i-xu-ng-3.jpg", callback);
        },
        function (callback) {
            groupCreate("Hóa Học", "Hóa", "https://i.ibb.co/zX0sqWh/t-i-xu-ng-1.jpg", callback);
        },
        function (callback) {
            groupCreate("Sinh Học", "Sinh", "https://i.ibb.co/fvPjnLR/t-i-xu-ng-2.jpg", callback);
        },
        function (callback) {
            groupCreate("Lịch Sử", "Sử", "https://i.ibb.co/27w1mBf/t-i-xu-ng-5.jpg", callback);
        },
        function (callback) {
            groupCreate("Địa Lí", "Địa", "https://i.ibb.co/DfQSbY9/t-i-xu-ng-4.jpg", callback);
        },
        function (callback) {
            groupCreate("Giáo Dục Công Dân", "GDCD", "https://i.ibb.co/bWnFFjK/unsplash-k4-N-ot-Bw-SRw.png", callback);
        },
        function (callback) {
            groupCreate("Giáo Dục Quốc Phòng", "GDQP", "https://i.ibb.co/2cKQSb4/unsplash-SOL1zqf-LV5-U.png", callback);
        },
        function (callback) {
            groupCreate("Công Nghệ", "Công nghệ", "https://i.ibb.co/7KJXw06/unsplash-7-Ja4-Pwtg69-U.png", callback);
        },
        function (callback) {
            groupCreate("Âm Nhạc", "Nhạc", "https://i.ibb.co/6m9h9jg/unsplash-YCQFgq-Oz-Lm-U.png", callback);
        },
        function (callback) {
            groupCreate("Mỹ thuật", "Mỹ thuật", "https://i.ibb.co/wwhtQpC/unsplash-yj-Xlyr-KIz2-A.png", callback);
        },
        function (callback) {
            groupCreate("Tin Học", "Tin học", "https://i.ibb.co/9v4cZPB/unsplash-Cmv-A0x-CDf-C8.png", callback);
        },
    ],
        cb);
}
function createPosts(cb) {
    async.parallel([
        function (callback) {
            joinGroup(users[0]._id, [groups[0]._id, groups[2]._id, groups[1]._id, groups[3]._id, groups[4]._id, groups[5]._id], callback);
        },
        function (callback) {
            joinGroup(users[2]._id, [groups[0]._id, groups[2]._id, groups[1]._id, groups[3]._id, groups[4]._id, groups[5]._id], callback);
        },
        function (callback) {
            joinGroup(users[1]._id, [groups[0]._id, groups[2]._id, groups[1]._id, groups[3]._id, groups[4]._id, groups[5]._id], callback);
        },
        function (callback) {
            postCreate('Hằng đẳng thức đáng nhớ', '(a^2 - b^2) = ?', users[2]._id, groups[0]._id, users[2].username, users[2].avatar, [], callback);
        },
        function (callback) {
            postCreate('Tiếng Anh', 'Khi nào dùng "hear" khi nào dùng "listen"?', users[1]._id, groups[2]._id, users[1].username, users[1].avatar, [], callback);
        },
        function (callback) {
            postCreate('Giải bài tập Toán', 'Mình cần lời giải cho bài tập này', users[0]._id, groups[0]._id, users[0].username, users[0].avatar, ["https://i.ibb.co/Cb9CQ6Y/276943369-507296864326405-7290028347139541417-n.jpg"], callback);
        },
        function (callback) {
            postCreate('Ôn tập lí', 'Mình có 1 đề lý để ôn tập các bạn có thể tham khảo bên cưới', users[2]._id, groups[4]._id, users[2].username, users[2].avatar, ["https://i.ibb.co/P54p81b/262812776-2275761469230517-3096170365263912502-n.png"], callback);
        },
    ], cb);
}
async.series([
    createGroupAuthors,
    // createPosts
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
import passport from 'passport';

import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FaceBookStrategy } from 'passport-facebook';
import db from '../app/models/index.model.js';
const { User } = db;

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then((user) => {
        done(null, user);
    });
});


passport.use(new GoogleStrategy({
    clientID: '781009823760-7ekibvct2t9h9gus4t3cifc2mshljp0k.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: "http://localhost:3000/auth/google/callback"
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            const checkEmailExist = await User.findOne({ $or: [{ googleID: profile.id }, { email: profile.emails[0].value }] })
            if (!checkEmailExist) {
                const newUser = new User(
                    {
                        username: profile.displayName,
                        email: profile.emails[0].value,
                        googleID: profile.id,
                        role: "user"
                    });
                newUser.save();
                return done(null, newUser);
            }
            if (checkEmailExist["password"]) {
                // neu tai khoai nay duoc tao bang form
                return done({ message: 'Tài khoản này đã được đăng ký. Vui lòng login bằng email và password' }, false)
            }
            return done(null, checkEmailExist);
        } catch (error) {
            console.log(error);
        }
    }
));

passport.use(new FaceBookStrategy({
    clientID: "1721561728034335",
    clientSecret: "312b7a5f083d960656acfc377168bcae",
    callbackURL: "localhost:3000//auth/facebook/callback"
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            const checkEmailExist = await User.findOne({ googleID: profile.id })
            if (!checkEmailExist) {
                const newUser = new User(
                    {
                        username: profile.displayName,
                        facebookID: profile.id,
                        role: "user"
                    });
                newUser.save();
                return done(null, newUser)
            }
            return done(null, checkEmailExist)
        } catch (error) {
            console.log(error);
        }
    }
));

export default passport;
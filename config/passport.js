import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FaceBookStrategy } from 'passport-facebook';

passport.serializeUser(function (user, done) {
    if (user.googleID) {
        done(null, user)
    }
    else {
        done(null, user.id);
    }
});

passport.deserializeUser(function (id, done) {
    if (id.id) {
        done(null, {
            username: id.displayName,
        })
    }
    else {
        User.findById(id, function (err, user) {
            done(err, user);
        });
    }
});

passport.use(new LocalStrategy(
    function (username, password, done) {
        User.findOne({
            username: username
        }).then(function (user) {
            if (user == null) {
                return done(null, false, { message: 'The username does not exist' })
            }
            else {
                bcrypt.compare(password, user.password, function (err, result) {
                    if (err) {
                        return done(err);
                    }
                    if (!result) {
                        return done(null, false, { message: 'Incorrect password' });
                    }
                    return done(null, user);
                })
            }
        }).catch(function (err) {
            return done(err);
        })
    }
));

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
                return done(null, newUser)
            }
            if (checkEmailExist["password"]) {
                // neu tai khoai nay duoc tao bang form
                return done(null, false, { message: 'Tài khoản này đã được đăng ký. Vui lòng login bằng email và password' })
            }
            return done(null, checkEmailExist)
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
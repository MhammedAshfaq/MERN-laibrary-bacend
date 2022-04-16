const jwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

const db = require('../config/connection');
const collection = require('../config/collection')

module.exports = function (passport) {
    let params = {
        secretOrKey: process.env.JWT_SECRET,
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
    };

    passport.use(
        new jwtStrategy(params, function (jwt_payload, next) {
            let emailId = jwt_payload.email;
            db.get().collection(collection.USER_COLLECTION).findOne({ email: emailId }, function (err, user) {
                if (err) {
                    return next(err, false)
                }
                if (user) {
                    next(null, user)
                } else {
                    next(null, false)
                }
            })
        })
    )
}

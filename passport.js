const passport = require('passport');
const BnetStrategy = require('passport-bnet').Strategy;

passport.use(new BnetStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "https://wowback.herokuapp.com/auth/bnet/callback",
    region: "eu"
}, function(accessToken, refreshToken, profile, done) {
    return done(null, profile);
}));

passport.serializeUser(function(user, done){
    done(null, user);
});
  
passport.deserializeUser(function(user, done){
    done(null, user);
});

module.exports = passport
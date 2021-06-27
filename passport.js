const passport = require('passport');
const BnetStrategy = require('passport-bnet').Strategy;
const callBackUrl = "https://wowback.herokuapp.com/auth/bnet/callback";

passport.use(new BnetStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: callBackUrl,
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
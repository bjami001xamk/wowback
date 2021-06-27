const express = require('express');
const app = express();
let cors = require('cors');
const controller = require('./controller');
const port = process.env.PORT || 8000;
const bodyParser = require('body-parser');
const passport = require('passport');
const BnetStrategy = require('passport-bnet').Strategy;

let session = require('express-session');
let RedisStore = require('connect-redis')(session);
let rtg   = require("url").parse(process.env.REDISTOGO_URL);
let redisClient = require("redis").createClient(rtg.port, rtg.hostname);
redisClient.auth(rtg.auth.split(":")[1]);
const callBackUrl = "https://wowback.herokuapp.com/auth/bnet/callback";

app.set('trust proxy', 1);
app.use(cors({
    credentials: true,
    origin:  ['https://pedantic-nightingale-fe0a38.netlify.app',"http://localhost:3000","https://localhost:3000"],
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended : true }));
app.use(session({
                store: new RedisStore({ client: redisClient }),
                secret: process.env.SESSION_SECRET,
                resave: false,
                saveUninitialized: false,
                cookie: {
                    secure: true,
                    httpOnly:false,
                    maxAge: 86400,
                    sameSite: 'none'
                }
            }));

passport.use(new BnetStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: callBackUrl,
    region: "eu"
}, function(accessToken, refreshToken, profile, done) {
    return done(null, profile);
}));
            
app.use('/', controller);

app.get('/auth/battlenet',
    passport.authenticate('bnet', { scope:'wow.profile'}), 
    () => {

});

app.get('/auth/bnet/callback',
    passport.authenticate('bnet', { scope:'wow.profile', failureRedirect: '/' }),
    function(req, res){
        console.log(req.user);
        res.redirect("https://pedantic-nightingale-fe0a38.netlify.app/");
});



app.listen(port, () => {
    console.log(`App is running in port ${port}`)
})
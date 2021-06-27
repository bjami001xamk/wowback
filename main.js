const express = require('express');
const app = express();
const cors = require('cors');
const router = require('./router');
const port = process.env.PORT || 8000;
const bodyParser = require('body-parser');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const rtg   = require("url").parse(process.env.REDISTOGO_URL);
const redisClient = require("redis").createClient(rtg.port, rtg.hostname);
redisClient.auth(rtg.auth.split(":")[1]);

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
                    maxAge: 86400000,
                    sameSite: 'none'
                }
            }));

const passport = require('./passport');

app.use(passport.initialize());
app.use(passport.session());      
app.use('/', router);

app.listen(port, () => {
    console.log(`App is running in port ${port}`)
})
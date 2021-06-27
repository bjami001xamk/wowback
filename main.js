const express = require('express');
const app = express();
let cors = require('cors');
const controller = require('./controller');
const port = process.env.PORT || 8000;
const bodyParser = require('body-parser');

let session = require('express-session');
let RedisStore = require('connect-redis')(session);
let rtg   = require("url").parse(process.env.REDISTOGO_URL);
let redisClient = require("redis").createClient(rtg.port, rtg.hostname);
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
                    maxAge: 86400,
                    sameSite: 'none'
                }
            }));
app.use('/', controller);


app.listen(port, () => {
    console.log(`App is running in port ${port}`)
})
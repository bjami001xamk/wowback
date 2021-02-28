const express = require('express')
var fs = require('fs')
var https = require('https')
const app = express();
var cors = require('cors')
//const redis = require('redis')
const port = process.env.PORT || 8000;
const btoa = require('btoa');
const fetch = require('node-fetch');
let session = require('express-session');
//var MemoryStore = require('memorystore')(session)
let RedisStore = require('connect-redis')(session)
let redisClient;

if (process.env.REDISTOGO_URL) {
    var rtg   = require("url").parse(process.env.REDISTOGO_URL);
    redisClient = require("redis").createClient(rtg.port, rtg.hostname);

    redisClient.auth(rtg.auth.split(":")[1]);
} else {
    redisClient = require("redis").createClient();
}


app.use(cors({
    credentials: true,
    origin: [
        'https://pedantic-nightingale-fe0a38.netlify.app/'
    ]
}));
//app.use(require('serve-static')(__dirname + '/../../public'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(session({
                store: new RedisStore({ client: redisClient }),
                secret: 'keyboard cat',
                resave: false,
                saveUninitialized: true,
                cookie: {secure: false}
            }));

/*
store: new MemoryStore({
                                            checkPeriod: 86400000 // prune expired entries every 24h
                                        }),
*/

let CLIENT_ID = "fe6148452f9f433bb0b7ccc766393e72";
let CLIENT_SECRET = "tconUpiuzW3EA9fYf8TeGrtuF4TsmSal";
let callBackUrl = "https://wowback.herokuapp.com/auth/bnet/callback";
const AUTHORIZE_ENDPOINT = 'https://eu.battle.net/oauth/authorize';

app.get('/login', (req, res) => {
    console.log(req.session)
    req.session.testi = "test";
    req.session.save();
    console.log(`sessioID:${req.sessionID}`);
    redisClient.get(req.sessionID, (err, reply) => {
        console.log('rediksen tiedot:')
        console.log(reply);
        if(reply) {
            console.log("Toimii?!?!?")
            res.status(400).send("Already logged in");
        }
    })


    if(req.session.access_token) {
        console.log("Toimii?!?!?")
        res.status(400).send("Already logged in");
    }

    const scopesString = encodeURIComponent('wow.profile');
    const redirectUriString = encodeURIComponent(callBackUrl);
    const authorizeUrl
        = `${AUTHORIZE_ENDPOINT}?client_id=${CLIENT_ID}&scope=${scopesString}&redirect_uri=${redirectUriString}&response_type=code&state=${req.sessionID}`;
    res.json(authorizeUrl);
});

app.get('/auth/bnet/callback', async(req, res) => {
    let params = new URLSearchParams();
    params.append('redirect_uri', "https://wowback.herokuapp.com/auth/bnet/callback");
    params.append('scope', "wow.profile");
    params.append('grant_type', 'authorization_code');
    params.append('code', req.query.code);
    console.log(`sessioID:${req.sessionID}`);
    console.log(`stateID:${req.query.state}`);
    const basicAuth = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);
    let headers = {
        authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
    };

    const response = await fetch(`https://eu.battle.net/oauth/token`, {
        method: 'POST',
        body: params,
        headers
    })
    const data = await response.json();

    
    console.log(data);
    
    console.log('Sessio palatessa:')
    console.log(req.session);

    redisClient.hmset(req.query.state, { access_token: data.access_token}, (err, res) => {
        console.log("redikseen tallennettu");
    })

    req.sessionStore.get(req.query.state, (err, session) => {   
        session.access_token = data.access_token;
        console.log('Sessio haun jälkeen:');
        console.log(session);

        req.sessionStore.set(req.query.state, session, (error) => {
            res.redirect("https://pedantic-nightingale-fe0a38.netlify.app/");
            

        });
    });
    
    
    
    
});


app.get('vara', (req, res) => {
    if(!req.session.access_token){
        res.send('error');
    }
});

app.get("/characterdata", async(req,res) => {
    let url = `https://eu.api.blizzard.com/profile/user/wow?namespace=profile-eu&access_token=${req.session.access_token}`;
    let response = await fetch(url);
    let data = await response.json();
    res.json(data);

})


/*http.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
  }, app).listen(port, function () {
    console.log(`App running in port ${port}`)
})*/

app.listen(port, () => {
    console.log(`App is running in port ${port}`)
})
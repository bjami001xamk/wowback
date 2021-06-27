const controller = require('express').Router();
const btoa = require('btoa');
const fetch = require('node-fetch');

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const callBackUrl = "https://wowback.herokuapp.com/auth/bnet/callback";
const AUTHORIZE_ENDPOINT = 'https://eu.battle.net/oauth/authorize';

controller.get('/login', (req, res) => {

    if(req.session.access_token) {
        res.status(400).json("Already logged in");
    } else{
        req.session.access_token = false;
        const scopesString = encodeURIComponent('wow.profile');
        const redirectUriString = encodeURIComponent(callBackUrl);
        const authorizeUrl
            = `${AUTHORIZE_ENDPOINT}?client_id=${CLIENT_ID}&scope=${scopesString}&redirect_uri=${redirectUriString}&response_type=code&state=${req.sessionID}`;
        res.json(authorizeUrl);
    }
});

controller.get('/auth/bnet/callback', async(req, res) => {
    let params = new URLSearchParams();
    params.append('redirect_uri', "https://wowback.herokuapp.com/auth/bnet/callback");
    params.append('scope', "wow.profile");
    params.append('grant_type', 'authorization_code');
    params.append('code', req.query.code);

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

    req.sessionStore.get(req.query.state, (err, session) => {   
        session.access_token = data.access_token;
        req.sessionStore.set(req.query.state, session, (error) => {
        });
    });
    res.redirect("https://pedantic-nightingale-fe0a38.netlify.app/");
    
});


controller.get("/characterdata", async(req,res) => {
    let url = `https://eu.api.blizzard.com/profile/user/wow?namespace=profile-eu&access_token=${req.session.access_token}`;
    let response = await fetch(url);
    let data = await response.json();
    let allCharacters = [];

    data.wow_accounts.forEach(account => {
        account.characters.forEach(character => {
            allCharacters.push(character);
        })
    });
    allCharacters.sort((a,b) => b.level - a.level);
    
    Promise.all(
        allCharacters.map(async (character) => {
            let mediaResponse = await fetch(`https://eu.api.blizzard.com/profile/wow/character/${character.realm.slug}/${character.name.toLowerCase()}/character-media?namespace=profile-eu&access_token=${req.session.access_token}`);
            let mediaData = await mediaResponse.json();
            
            //This battle.net api returns data in different formats depending on how old the character is or how long ago the character was logged in.
            if(mediaResponse.status === 200) {
                character.mediainfo = mediaData;
            } else {
                character.mediainfo = null;
            }

            if(character.mediainfo && character.mediainfo.hasOwnProperty('assets')  ) {
                character.mediainfo.avatar_url = character.mediainfo.assets[0].value;
                character.mediainfo.render_url = character.mediainfo.assets[2].value;
            }
        })
    ).then(() => {
        res.json(allCharacters);
    })
})

controller.get("/logout", async(req, res) => {
    req.session.destroy((err) => {
        res.status(200).json('Logged out successfully');
    });
})

controller.get('/characterstatistics', async(req, res) => {
    let realm = req.query.realm;
    let characterName = req.query.characterName;
    let response = await fetch(`https://eu.api.blizzard.com/profile/wow/character/${realm}/${characterName.toLowerCase()}/statistics?namespace=profile-eu&locale=en_eu&access_token=${req.session.access_token}`)
    let data = await response.json();
    res.json(data);
});

module.exports = controller;
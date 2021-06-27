const router = require('express').Router();
const fetch = require('node-fetch');
const passport = require('passport');

router.get('/auth/battlenet',
    passport.authenticate('bnet', { scope:'wow.profile'}), 
    () => {
});

router.get('/auth/bnet/callback',
    passport.authenticate('bnet', { scope:'wow.profile', failureRedirect: '/' }),
    function(req, res){
        console.log(req.user);
        res.redirect("https://pedantic-nightingale-fe0a38.netlify.app/");
});

router.get('/login', (req, res) => {
    if(req.user) {
        res.status(200).json("Already logged in");
    } else {
        res.status(401).json('Login required');
    }
});

router.get("/characterdata", async(req, res) => {
    let response = await fetch(`https://eu.api.blizzard.com/profile/user/wow?namespace=profile-eu&access_token=${req.user.token}`);
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
            let mediaResponse = await fetch(`https://eu.api.blizzard.com/profile/wow/character/${character.realm.slug}/${character.name.toLowerCase()}/character-media?namespace=profile-eu&access_token=${req.user.token}`);
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
});

router.get("/logout", async(req, res) => {
    req.logout();
    res.status(200).json('Logged out successfully');
})

router.get('/characterstatistics', async(req, res) => {
    let realm = req.query.realm;
    let characterName = req.query.characterName;

    if(!realm || !characterName) {
        return res.status(400).json('Missing realm and/or character name');
    }

    let response = await fetch(`https://eu.api.blizzard.com/profile/wow/character/${realm}/${characterName.toLowerCase()}/statistics?namespace=profile-eu&locale=en_eu&access_token=${req.user.token}`)
    let data = await response.json();
    res.json(data);
});

module.exports = router;
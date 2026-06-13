const https = require('https');
https.get('https://api.football-data.org/v4/competitions/WC/matches', { headers: { 'X-Auth-Token': '7285378ac94548e6897fc532cc014228' } }, (res) => {
    let data = ''; res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const wcData = JSON.parse(data);
        console.log("Venue Example:", wcData.matches[0].venue);
    });
});

const http = require('http');
const fs = require('fs');
const url = require('url');
const queryString = require('query-string');
const request = require('request');

const PORT = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../client/index.html`);

console.log("check");

const onRequest = (req, response) => {
  console.log(req.url);
  
  switch (req.url) {
    case 'https://pacific-garden-65629.herokuapp.com/':
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.write(index);
      response.end();
      break;
    case 'https://pacific-garden-65629.herokuapp.com/search':
      const apiKey = "RGAPI-dc7a3219-69d6-4213-8027-ec29e4767ff9";
      //get the queryString and pull out the name
      const parsed = url.parse(req.url);
      const params = query.parse(parsed.query);
      const summonerName = params["name"];

      //get the summoner's data
      const summonerURL = "https://na1.api.riotgames.com/lol/summoner/v3/summoners/by-name/" + summonerName + "?api_key=" + apiKey;
      request(summonerURL, function(err, response, body) {
        if (err) {
          console.log(err);
        } else {
          var summonerData = JSON.parse(body);
          console.log(summonerData);
        }
      });
      break;
    default:
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.write(index);
      response.end();
      break;
  }
}

//app.get('/search', function(req, res){
//  var data = {};
//  const apiKey = "RGAPI-dc7a3219-69d6-4213-8027-ec29e4767ff9";
//  
//  //get the queryString and pull out the name
//  const parsed = url.parse(req.url);
//  const params = query.parse(parsed.query);
//  const summonerName = params["name"];
//  
//  //get the summoner's data
//  const summonerURL = "https://na1.api.riotgames.com/lol/summoner/v3/summoners/by-name/" + summonerName + "?" + apiKey;
//  request(summonerURL, function(err, response, body) {
//    if (err) {
//      console.log(err);
//    } else {
//      var summonerData = JSON.parse(body);
//      console.log(summonerData);
//      
//      //pull their id
//      const summonerId = summonerData[summonerName].id;
//      data["name"] = summonerData[summonerName].name;
//      
//      //pull the recent matches
//      request(summonerURL, function(err, response, body) {
//        if (err) {
//          console.log(err);
//        } else {
//          var recentMatches = JSON.parse(body);
//          
//          var match;
//          
//          for (var i = 0; i < recentMatches["matches"].length; i++) {
//            if (recentMatches[["matches"][i]["role"] == "DUO_SUPPORT"]) {
//              match = recentMatches["matches"][i];
//            }
//          }
//          
//          const stringMessage = JSON.stringify(match);
//          
//          response.writeHead(200, { 'Content-Type': 'application/json' });
//          response.write(stringMessage);
//          response.end();
//        }
//      });
//    }
//  });
//});

const server = http.createServer(onRequest);

server.listen(PORT, (err) => {
  if (err) {
    throw err;
  }
});
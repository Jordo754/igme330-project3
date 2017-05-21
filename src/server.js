const http = require('http');
const fs = require('fs');
const url = require('url');
const queryString = require('query-string');
const request = require('request');

const PORT = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../client/index.html`);

const onRequest = (req, response) => {
  console.log(req.url);
  switch (req.url) {
    case '/':
      response.writeHead(200, { 'Content-Type': 'text/html' });
      response.write(index);
      response.end();
      break;
    case '/search':
      var data = {};
      const apiKey = "RGAPI-dc7a3219-69d6-4213-8027-ec29e4767ff9";;
      var summonerName = "Jordo754";
      var summonerId;
      var matchUrl = "";

      //get the summoner's data
      const summonerURL = "https://na1.api.riotgames.com/lol/summoner/v3/summoners/by-name/"+ summonerName + "?api_key=" + apiKey;
      request(summonerURL, function(err, rep, body) {
        if (err) {
          console.log(err);
        } else {
          var summonerData = JSON.parse(body);

          //pull their id
          summonerId = summonerData["accountId"];
          summonerName = summonerData["name"];
          data["name"] = summonerData["name"];
          
          //pull the recent matches
          matchesUrl = "https://na1.api.riotgames.com/lol/match/v3/matchlists/by-account/" + summonerId + "/recent?api_key=" + apiKey;
          
          //get recent matches
          request(matchesUrl, function(err, rep, body) {
            if (err) {
              console.log(err);
            } else {
              var recentMatches = JSON.parse(body);
              var matchId;

              for (var i = 0; i < recentMatches["matches"].length; i++) {
                if (recentMatches["matches"][i]["role"] == "DUO_SUPPORT") {
                  matchId = recentMatches["matches"][i]["gameId"];
                  break;
                }
              }
              
              matchUrl = "https://na1.api.riotgames.com/lol/match/v3/matches/" + matchId + "?api_key=" + apiKey;
              
              request(matchUrl, function(err, rep, body) {
                if (err) {
                  console.log(err);
                } else {
                  var matchData = JSON.parse(body);
              
                  //search for my matchId
                  var playerSearch = matchData["participantIdentities"];
                  var myId = 0;
                  var enemyId = 0;
                  var champId;
                  var enemyChampId;
                  
                  for (var i = 0; i < 10; i++) {
                    if (playerSearch[i]["player"]["summonerName"] == summonerName) {
                      myId = playerSearch[i]["participantId"];
                      champId = matchData["participants"][i]["championId"];
                      
                      //grab ward placed/killed, kills, assists
                      data["wardsPlaced"] = matchData["participants"][i]["stats"]["wardsPlaced"];
                      data["wardsKilled"] = matchData["participants"][i]["stats"]["wardsKilled"];
                      data["kills"] = matchData["participants"][i]["stats"]["kills"];
                      data["assists"] = matchData["participants"][i]["stats"]["assists"];
                      data["redWards"] = matchData["participants"][i]["stats"]["visionWardsBoughtInGame"];
                      break;
                    }
                  }
                  
                  //find enemyId
                  if (myId >= 5) {
                    for (var i = 0; i < 5; i++) {
                      if (matchData["participants"][i]["timeline"]["role"] == "DUO_SUPPORT") {
                        enemyId = i;
                        break;
                      }
                    }
                  } else {
                    for (var i = 5; i < 10; i++) {
                      if (matchData["participants"][i]["timeline"]["role"] == "DUO_SUPPORT") {
                        enemyId = i;
                        break;
                      }
                    }
                  }
                  
                  data["enemyName"] = playerSearch[enemyId]["player"]["summonerName"];
                  enemyChampId = matchData["participants"][enemyId]["championId"];
                  data["enemyWardsPlaced"] = matchData["participants"][enemyId]["stats"]["wardsPlaced"];
                  data["enemyWardsKilled"] = matchData["participants"][enemyId]["stats"]["wardsKilled"];
                  data["enemyKills"] = matchData["participants"][enemyId]["stats"]["kills"];
                  data["enemyAssists"] = matchData["participants"][enemyId]["stats"]["assists"];
                  data["enemyRedWards"] = matchData["participants"][enemyId]["stats"]["visionWardsBoughtInGame"];
                  
                  //get total kills for each team
                  var blueKills = 0;
                  var redKills = 0;
                  var killPar = 0;
                  var enemyKillPar = 0;
                  
                  for (var i = 0; i < 5; i++) {
                    blueKills += matchData["participants"][i]["stats"]["kills"];
                  }
                  
                  for (var i = 5; i < 10; i++) {
                    redKills += matchData["participants"][i]["stats"]["kills"];
                  }
                  
                  if (myId < 5) {
                    killPar = data["kills"] + data["assists"] / blueKills;
                    data["killPar"] = Number(Math.round(killPar+'e2')+'e-2');
                    
                    enemyKillPar = data["enemyKills"] + data["enemyAssists"] / redKills;
                    data["enemyKillPar"] = Number(Math.round(enemyKillPar+'e2')+'e-2');
                  } else {
                    killPar = data["kills"] + data["assists"] / redKills;
                    data["killPar"] = Number(Math.round(killPar+'e2')+'e-2');
                    
                    enemyKillPar = data["enemyKills"] + data["enemyAssists"] / blueKills;
                    data["enemyKillPar"] = Number(Math.round(enemyKillPar+'e2')+'e-2');
                  }

                  champURL = "https://na1.api.riotgames.com/lol/static-data/v3/champions/" + champId + "?champData=all&api_key=" + apiKey;
                  enemyChampURL = "https://na1.api.riotgames.com/lol/static-data/v3/champions/" + enemyChampId + "?champData=all&api_key=" + apiKey;

                  request(champURL, function(err, rep, body) {
                    if (err) {
                      console.log(err);
                    } else {
                      var championStatic = JSON.parse(body);

                      data["champion"] = championStatic["name"];
                      data["title"] = championStatic["title"];
                      data["image"] = "http://ddragon.leagueoflegends.com/cdn/img/champion/loading/" + championStatic["name"] + "_0.jpg";
                      
                      request(enemyChampURL, function(err, rep, body) {
                        if (err) {
                          console.log(err);
                        } else {
                          var enemyChampionStatic = JSON.parse(body);

                          data["enemyChampion"] = enemyChampionStatic["name"];
                          data["enemyTitle"] = enemyChampionStatic["title"];
                          data["enemyImage"] = "http://ddragon.leagueoflegends.com/cdn/img/champion/loading/" + enemyChampionStatic["name"] + "_0.jpg";
                        }
                        
                        const stringMessage = JSON.stringify(data);
                  
                        response.writeHead(200, { 'Content-Type': 'application/json' });
                        response.write(stringMessage);
                        response.end();
                      });
                    }
                  });
                }
              });
            }
          });
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

//const stringMessage = JSON.stringify(match);
//
//response.writeHead(200, { 'Content-Type': 'application/json' });
//response.write(stringMessage);
//response.end();

const getMatch = (url, req, response) => {
  request(url, function(err, rep, body) {
    if (err) {
      console.log(err);
    } else {
      var recentMatches = JSON.parse(body);
      var match;

      for (var i = 0; i < recentMatches["matches"].length; i++) {
        if (recentMatches["matches"][i]["role"] == "DUO_SUPPORT") {
          match = recentMatches["matches"][i];
          break;
        }
      }
      
      console.log(match);

      //const stringMessage = JSON.stringify(match);
      //
      //response.writeHead(200, { 'Content-Type': 'application/json' });
      //response.write(stringMessage);
      //response.end();
    }
  });
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
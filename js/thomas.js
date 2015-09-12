/* classes */
var game = function(id, position) {
    this.id = id;
    this.position = position;
    this.wins = 0;
    this.losses = 0;
    this.locked = false;
    this.ranked = false;
    
    var differential = function() {
        return wins - losses;
    }
}
game.prototype.toString = function() {
    return this.id;
}

var games = function(list) {
    // private
    /*var*/ matchups = [];
    
    
    var isFirstGameBetter = function(game1, game2) {
        // todo: get user input
        
        console.log('contest: ' + game1 + ' vs ' + game2);
        
        return game1.id < game2.id;
    }
    
    var logMatchup = function(winner, loser) {
        var matchup = {};
        matchup.winner = winner;
        matchup.loser = loser;
        
        matchups.push(matchup);
    }
    
    var rankGames = function(games, gameIndex1, gameIndex2) {
        var isFirstBetter = 
            isFirstGameBetter(games[gameIndex1], games[gameIndex2]);
        
        if(isFirstBetter)
        {
            games[gameIndex1].wins += 1;
            games[gameIndex2].losses += 1;
            logMatchup(games[gameIndex1].id, games[gameIndex2].id);
            games = reposition(games, gameIndex1, gameIndex2);
        }
        else
        {
            games[gameIndex1].losses += 1;
            games[gameIndex2].wins += 1;
            logMatchup(games[gameIndex2].id, games[gameIndex1].id);
            games = reposition(games, gameIndex2, gameIndex1);
        }
        
        // check_for_locks
        
        return games;
    }
    
    var reposition = function(games, winnerIndex, loserIndex) {
        var winnerPosition = games[winnerIndex].position;
        var loserPosition = games[loserIndex].position;
        
        if(winnerPosition < loserPosition) {
            if(games[winnerIndex].differential() > 0)
            {
                // winner.position increases by differential, as long as it does not move past any games that have been ranked above
            }
            
            if(games[loserIndex].differential() < 0)
            {
                // loser.position decreases by differential, as long as it does not move past any games that have been ranked below
            }
        }
        else {
            // Array.prototype.map() only supported in IE9+
            games.map(function(item){
                if(item.position >= loserPosition && item.position < winnerPosition)
                    item.position += 1;
            });
            
            games[winnerIndex].position = loserPosition;
        }
        
        return games;
    }
    
    
    // public
    this.list = list;
    
    this.sortList = function() {
        this.list.sort(compareGames);
    }
    
    this.contestAll = function() {
        if(this.list.length <= 1)
        {
            // todo: lock all
            return;
        }
        
        for(var i = 0; i < this.list.length; i += 2)
        {
            this.list = rankGames(this.list, i, i + 1);
            //this.sortList();
        }
        
        console.log(matchups);
    }
}
games.prototype.toString = function() {
    return this.list.toString();
}



/* methods */
var compareGames = function(game1, game2) {
  if (game1.position < game2.position)
    return -1;
    
  if (game1.position > game2.position)
    return 1;
  
  return 0;
}

var getGames = function() {
    // todo: get user input
    
    var games = [];
    var i, j;
    
    for(i = 1, j = 10; i <= 10; i++, j--) {
        games.push(new game(i, j));
    }
    
    return games;
}



/* main */
var games_array = getGames();
var games_object = new games(games_array);
games_object.toString();
games_object.sortList();
games_object.toString();
games_object.contestAll();












getAllRankedLower:
    if none ranked lower
        return
    else
        return getAllRankedLower(lowerRanked)



var getAllRankedLower = function(matchups, id, subordinates) {
    var lower = matchups.map(function(item){
        if (item.winner == id) 
            return item.loser;
    }).filter(function(item){
        return item;
    });
    
    if (lower.length == 0) {
        subordinates.push(id);
        return subordinates;
    }
    else
        return lower.map(function(item){
            getAllRankedLower(matchups, item, subordinates);
        });
}

g_losers = []
var getAllLosers = function (matchups, id) {
    var losers = matchups.map(function(item){
        if (item.winner == id) 
            return item.loser;
    }).filter(function(item){
        return item;
    });
    
    //g_losers.push(id);
    
    if (losers.length == 0) {
        return [id];
    }
    else {
        return losers.map(function(item) {
            return getAllLosers(matchups, item);
        });
    }
}




g_losers = []
var getAllLosers = function (matchups, id) {
    var losers = matchups.map(function(item){
        if (item.winner == id) 
            return item.loser;
    }).filter(function(item){
        return item;
    });
    
    //g_losers.push(id);
    
    if (losers.length == 0) {
        return [id];
    }
    else {
        losers.map(function(item) {
            return getAllLosers(matchups, item);
        });
        
        losers.push(id);
        
        return losers;
    }
}











function unique(a) {
    return a.sort().filter(function(item, pos, ary) {
        return !pos || item != ary[pos - 1];
    })
}

var matchups = [];
matchups.push({'winner': 1, 'loser': 2});
matchups.push({'winner': 3, 'loser': 4});
matchups.push({'winner': 5, 'loser': 6});
matchups.push({'winner': 7, 'loser': 8});
matchups.push({'winner': 9, 'loser': 10});

matchups.push({'winner': 1, 'loser': 3});
matchups.push({'winner': 5, 'loser': 7});
matchups.push({'winner': 5, 'loser': 9});
matchups.push({'winner': 2, 'loser': 4});
matchups.push({'winner': 6, 'loser': 8});
matchups.push({'winner': 6, 'loser': 10});

var parent = 1;
var losers1 = [];
var losers2 = [];
for(var i = 0; i < matchups.length; i++)
{
    if(matchups[i].winner == parent)
        losers1.push(matchups[i].loser);
}

if(losers1.length > 0)
{
    for(var i = 0; i < losers1.length; i++)
    {
        for(var j = 0; j < matchups.length; j++)
        {
            if(losers1[i] == matchups[j].winner)
                losers2.push(matchups[j].loser);
        }
    }
}

var losers = unique(losers1.concat(losers2));





var flatten = function(input, shallow, strict, output) {
    output = output || [];
    var idx = output.length;
    for (var i = 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (shallow) {
          var j = 0, len = value.length;
          while (j < len) output[idx++] = value[j++];
        } else {
          flatten(value, shallow, strict, output);
          idx = output.length;
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };
/**************************************************************
    CLASSES
**************************************************************/
/**
 * A board game with rank information.
 * @class
 * @param {int} id - A unique id.
 * @param {position} - The current position in the ranked list.
 */
var game = function(id, position) {
    this.id = id;
    this.position = position;
    this.wins = 0;
    this.losses = 0;
    this.locked = false;
    this.rankedThisIteration = false;
    
    var differential = function() {
        return wins - losses;
    }
}
/**
 * ToString for a game.
 * @method
 */
game.prototype.toString = function() {
    return this.id;
}



/**
 * A collection of games.
 * @class
 * @param {array} list - An array of games.
 */
var games = function(list) {
    // private
    /*var*/ game_matchups = new matchups();
    
    var compareGames = function(game1, game2) {
        if (game1.position < game2.position)
            return -1;
        
        if (game1.position > game2.position)
            return 1;
      
        return 0;
    }

    var isFirstGameBetter = function(game1, game2) {
        // todo: get user input
        
        console.log('contest: ' + game1 + ' vs ' + game2);
        
        return game1.id < game2.id;
    }
    
    var lock = function(games, index) {
        var gameToLock = games[index];
        gameToLock.locked = true;
        games[index] = gameToLock;
        return games;
    }
    
    var lockAll = function(games) {
        return _.each(games, function(element, index, list) {return lock(list, index);});
    }
    
    var lockCompletelySortedGames = function(games) {
        for(var i = 0; i <= games.length; i++)
        {
            var gamesRankedLowerCount = game_matchups.getAllRankedLower(games[i].id).length;
            var gamesUnlockedExcludingCurrentGameCount = unlockedList().length - 1;
            
            if(!games[i].locked && gamesRankedLowerCount == gamesUnlockedExcludingCurrentGameCount) {
                games = lock(games, i);
            }
            else {
                break;
            }
        }
        
        for(var i = games.length; i <= 0; i--)
        {
            var gamesRankedHigherCount = game_matchups.getAllRankedHigher(games[i].id).length;
            var gamesUnlockedExcludingCurrentGameCount = unlockedList().length - 1;
            
            if(!games[i].locked && gamesRankedHigherCount == gamesUnlockedExcludingCurrentGameCount) {
                games = lock(games, i);
            }
            else {
                break;
            }
        }
        
        return games;
    }
    
    var logMatchup = function(winner, loser) {
        var match = new matchup(winner, loser);
        
        game_matchups.add(match);
    }
    
    var rankGames = function(games, gameIndex1, gameIndex2) {
        var isFirstBetter = isFirstGameBetter(games[gameIndex1], games[gameIndex2]);
        
        if(isFirstBetter) {
            games[gameIndex1].wins += 1;
            games[gameIndex2].losses += 1;
            logMatchup(games[gameIndex1].id, games[gameIndex2].id);
            games = reposition(games, gameIndex1, gameIndex2);
        }
        else {
            games[gameIndex1].losses += 1;
            games[gameIndex2].wins += 1;
            logMatchup(games[gameIndex2].id, games[gameIndex1].id);
            games = reposition(games, gameIndex2, gameIndex1);
        }
        
        games[gameIndex1].rankedThisIteration = true;
        games[gameIndex2].rankedThisIteration = true;
        games = lockCompletelySortedGames(games);
        
        return games;
    }
    
    var reposition = function(games, winnerIndex, loserIndex) {
        var winnerPosition = games[winnerIndex].position;
        var loserPosition = games[loserIndex].position;
        
        // if winner is positioned above loser
        if(winnerPosition < loserPosition) {
            var winner = games[winnerIndex];
            var loser = games[loserIndex];
            var gamesRankedAboveWinner = getAllRankedHigher(winner.id);
            var gamesRankedBelowLoser = getAllRankedLower(loser.id);
            
            if(winner.differential() > 0) {
                var newPosition = winner.position - winner.differential();
                
                for(var i = winnerPosition  - 1; i >= newPosition; i--) {
                    if(games[i].locked || _.contains(gamesRankedAboveWinner, games[i].id)) {
                        newPosition = i + 1;
                        break;
                    }
                    else {
                        games[i].position += 1;
                    }
                }
                
                games[winnerIndex].position = newPosition;
            }
            
            if(loser.differential() < 0)
            {
                var newPosition = loser.position - loser.differential();
                
                for(var i = loserPosition + 1; i <= newPosition; i++) {
                    if(games[i].locked || _.contains(gamesRankedBelowLoser, games[i].id)) {
                        newPosition = i - 1;
                        break;
                    }
                    else {
                        games[i].position -= 1;
                    }
                }
                
                games[loserIndex].position = newPosition;
            }
        }
        else {
            _.map(games, function(item) {
                if(item.position >= loserPosition && item.position < winnerPosition)
                    item.position += 1;
            });
            
            games[winnerIndex].position = loserPosition;
        }
        
        return games;
    }
    
    var unlockedList = function() {
        return _.filter(this.list, function(game) {return !game.locked});
    }
    
    
    // public
    this.list = list;
    
    this.doesMatchupRemain = function() {
        return _.filter(list, function(game) {
            return !game.rankedThisIteration && !game.locked;
        }).length >= 2;
    }
    
    this.flickchartSort = function() {
        var self = this;
        
        // if there's only one game to sort, it is already sorted
        if(self.list.length <= 1) {
            lockList();
            return;
        }
        
        while(self.doesMatchupRemain()) {
            var game1 = self.getFirstNotLockedOrRanked();
            var game1Index = _.indexOf(self.list, game1);
            var game2 = self.getOpponent(self.list, game1);
            var game2Index = _.indexOf(self.list, game2);
            
            self.list = rankGames(self.list, game1Index, game2Index);
            self.sortList();
        }
        
        console.log(game_matchups.toString());
    }
    
    this.getFirstNotLockedOrRanked = function() {
        return _.find(list, function(game) {
            return !game.locked && !game.rankedThisIteration;
        });
    }
    
    this.getOpponent = function(games, game1) {
        var game2 = _.find(games, function(game) {
            return !game.locked && !game.rankedThisIteration && game.id !== game1.id && !game_matchups.isRanked(game1.id, game.id);
        });
        
        if (game2 === undefined) {
            var game2 = _.find(games, function(game) {
                return !game.locked && game.id !== games[game1Index].id && !game_matchups.isRanked(game1.id, game.id);
            });
        }
        
        return game2;
    }
    
    this.quickSort = function() {
        
    }
    
    this.sortList = function() {
        this.list.sort(compareGames);
    }
}
/**
 * ToString for games.
 * @method
 */
games.prototype.toString = function () {
    return this.list.toString();
}



/**
 * A matchup of two games.
 * @class
 * @param {string} winner - The winner of the matchup.
 * @param {string} loser - The loser of the matchup.
 */
var matchup = function (winner, loser) {
    this.winner = winner;
    this.loser = loser;
}
/**
 * ToString for a matchup.
 * @method
 */
matchup.prototype.toString = function () {
    return this.winner + '>' + this.loser;
}



/**
 * A collection of matchups.
 * @class
 */
var matchups = function () {
    this.list = [];

    this.add = function (matchup) {
        this.list.push(matchup);
    }
    
    this.getAllRankedLower = function (id, includeId) {
        if (includeId == undefined)
            includeId = false;
        
        var self = this;
        
        var losers = self.list.map(function(item){
            if (item.winner == id) 
                return item.loser;
        }).filter(function(item){
            return item;
        });
        
        if (losers.length == 0) {
            return includeId ? [id] : [];
        }
        else {
            var children = losers.map(function(item) {
                return self.getAllRankedLower(item, true);
            });
            
            losers = losers.concat(_.flatten(children));
            
            if(includeId)
                losers.push(id);
            
            return _.uniq(losers);
        }
    }

    this.getAllRankedHigher = function (id, includeId) {
        if (includeId == undefined)
            includeId = false;
        
        var self = this;
        
        var winners = self.list.map(function(item){
            if (item.loser == id) 
                return item.winner;
        }).filter(function(item){
            return item;
        });
        
        if (winners.length == 0) {
            return includeId ? [id] : [];
        }
        else {
            var parents = winners.map(function(item) {
                return self.getAllRankedHigher(item, true);
            });
            
            winners = winners.concat(_.flatten(parents));
            
            if(includeId)
                winners.push(id);
            
            return _.uniq(winners);
        }
    }
    
    this.isRanked = function (gameId1, gameId2) {
        var self = this;
        
        var higher = self.getAllRankedHigher(gameId1);
        var lower = self.getAllRankedLower(gameId1);
        var all = higher.concat(lower);
        
        return _.contains(all, gameId2);
    }
}
/**
 * ToString for matchups.
 * @method
 */
matchups.prototype.toString = function() {
    return this.list.toString();
}



/**************************************************************
    METHODS
**************************************************************/
var getGames = function() {
    // todo: get user input
    
    var games = [];
    var i, j;
    
    for(i = 1, j = 10; i <= 10; i++, j--) {
        games.push(new game(i, j));
    }
    
    return games;
}


/**************************************************************
    TEMP MAIN
**************************************************************/
var games_array = getGames();
var games_object = new games(games_array);
games_object.toString();
games_object.sortList();
games_object.toString();
games_object.flickchartSort();
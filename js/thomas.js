/**************************************************************
    CLASSES
**************************************************************/
/**
 * A board game with rank information.
 * @class
 * @param {int} id - A unique id.
 * @param {int} position - The current position in the ranked list.
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
 * @returns The string representation of a game.
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
    /*var*//* "var" is commented out for debugging*/ game_matchups = new matchups();
    
    /**
     * Compare the positions of two games.
     * @method
     * @param {game} game1 - The first game to compare by position.
     * @param {game} game2 - The second game to compare by position.
     * @returns 
     */
    var compareGames = function(game1, game2) {
        if (game1.position < game2.position)
            return -1;
        
        if (game1.position > game2.position)
            return 1;
      
        return 0;
    }

    /**
     * Ask the user to choose between two games.
     * @method
     * @param {game} game1 - The first game for the user to rank.
     * @param {game} game2 - The second game for the user to rank.
     * @returns 
     */
    var isFirstGameBetter = function(game1, game2) {
        // todo: get user input
        
        console.log('contest: ' + game1 + ' vs ' + game2);
        
        // todo: Gonna need to use promise pipelines since these events are raised after returning from this function
        promptUser("Which game do you prefer?", [ 
            { text: game1, click: function() { game1.wins++; } }, 
            { text: game2, click: function() { game2.wins++; } } 
        ]);        
        
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
    
    var lockCompletelySortedGames = function(games, matchups) {
        for(var i = 0; i <= games.length; i++)
        {
            var gamesRankedLowerCount = matchups.getAllRankedLower(games[i].id).length;
            var gamesUnlockedExcludingCurrentGameCount = getUnlockedGames(games).length - 1;
            
            if(!games[i].locked && gamesRankedLowerCount == gamesUnlockedExcludingCurrentGameCount) {
                games = lock(games, i);
            }
            else {
                break;
            }
        }
        
        for(var i = games.length; i <= 0; i--)
        {
            var gamesRankedHigherCount = matchups.getAllRankedHigher(games[i].id).length;
            var gamesUnlockedExcludingCurrentGameCount = getUnlockedGames(games).length - 1;
            
            if(!games[i].locked && gamesRankedHigherCount == gamesUnlockedExcludingCurrentGameCount) {
                games = lock(games, i);
            }
            else {
                break;
            }
        }
        
        return games;
    }
    
    var logMatchup = function(matchups, winner, loser) {
        var match = new matchup(winner, loser);
        
        matchups.add(match);
        
        return matchups;
    }
    
    //todo: pass game_matchups into rankGames as a parameter?
    var rankGames = function(games, gameIndex1, gameIndex2) {
        var isFirstBetter = isFirstGameBetter(games[gameIndex1], games[gameIndex2]);
        
        if(isFirstBetter) {
            games[gameIndex1].wins += 1;
            games[gameIndex2].losses += 1;
            game_matchups = logMatchup(game_matchups, games[gameIndex1].id, games[gameIndex2].id);
            games = reposition(games, gameIndex1, gameIndex2);
        }
        else {
            games[gameIndex1].losses += 1;
            games[gameIndex2].wins += 1;
            game_matchups = logMatchup(game_matchups, games[gameIndex2].id, games[gameIndex1].id);
            games = reposition(games, gameIndex2, gameIndex1);
        }
        
        games[gameIndex1].rankedThisIteration = true;
        games[gameIndex2].rankedThisIteration = true;
        games = lockCompletelySortedGames(games, game_matchups);
        
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
    
    var getUnlockedGames = function(games) {
        return _.filter(games, function(game) {return !game.locked});
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
            var game2 = self.getOpponent(self.list, game1, game_matchups);
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
    
    this.getOpponent = function(games, game1, matchups) {
        var game2 = _.find(games, function(game) {
            return !game.locked && !game.rankedThisIteration && game.id !== game1.id && !matchups.isRanked(game1.id, game.id);
        });
        
        if (game2 === undefined) {
            var game2 = _.find(games, function(game) {
                return !game.locked && game.id !== games[game1Index].id && !matchups.isRanked(game1.id, game.id);
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
    
    //todo: pass in list as parameter
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
    
    //todo: pass in list as parameter
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

var closePrompt = function () {  
    document.getElementById("thomas-dialog").style.display = "none";
};
    
// Promp the user with a message and present multiple options.
// Message: the message to promt the user
// Buttons: an array of object of the form { text: "link text", click: function() { /* action */ } }
var promptUser = function(message, buttons) {
    if (document.getElementById("thomas-dialog") != null) {
        document.getElementById("thomas-dialog").style.display = "flex";
    }
    else {
        var appendHtml = function (el, str) {
            var div = document.createElement('div');
            div.innerHTML = str;
            while (div.children.length > 0) {
                el.appendChild(div.children[0]);
            }
        };
        
        // Generate a list of buttons (reverse iterate since we're floating elements right)
        var buttonsHtml = '';
        var buttonEvents = new Array();
        for (var i = buttons.length - 1; i >= 0; i--) {
            buttons[i].buttonId = 'thomas-dialog-opt-' + i;
            buttonsHtml += '<a id="' + buttons[i].buttonId + '" onclick="closePrompt()" href="javascript: void(0)">' + buttons[i].text + '</a>';
        }
        
        appendHtml(document.body,
            '<div id="thomas-dialog">' +
            '    <div id="thomas-dialog-content">' +
            '        <p>' + message + '</p>' +
            '        <div>' + buttonsHtml + '</div>' +
            '    </div>' +
            '</div>');
            
        // Add events to buttons after adding them to the DOM
        for (var i = 0; i < buttons.length; i++) {
            document.getElementById(buttons[i].buttonId).addEventListener("click", buttons[i].click);
        }
    }
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
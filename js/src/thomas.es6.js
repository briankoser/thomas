/**************************************************************
    CLASSES
**************************************************************/
/**
 * A request for the user to pick which of two games he prefers.
 * @class
 * @param {string} game1 - The first game.
 * @param {string} game2 - The second game.
 * @param {string} game1Index - The index of the first game.
 * @param {string} game2Index - The index of the second game.
 * @param {string} winner - The index of the winner of the matchup.
 */
class Battle {
    constructor (game1, game2, game1Index, game2Index, winner) {
        this.game1 = game1;
        this.game2 = game2;
        this.game1Index = game1Index;
        this.game2Index = game2Index;
        this.winnerIndex = winner;
        this.isNull = game1 == undefined;
    }
}



/**
 * A board game with rank information.
 * @class
 * @param {int} id - A unique id.
 * @param {int} position - The current position in the ranked list.
 * @param {string} name - The name of the game.
 */
class Game {
    constructor (id, position, name) {
        this.id = id;
        this.position = position;
        this.name = name;
        this.wins = 0;
        this.losses = 0;
        this.locked = false;
        this.rankedThisIteration = false;
    }
    
    differential () {
        return this.wins - this.losses;
    }
    
    toString () {
        return this.name;
    }
}



/**
 * Static helper methods for Games.
 * @class
 */
class GamesHelpers {
    /**
     * Compare the positions of two games.
     * @method
     * @param {game} game1 - The first game to compare by position.
     * @param {game} game2 - The second game to compare by position.
     * @returns 
     */
    static compareGames (game1, game2) {
        return game1.position - game2.position;
    }
    
    static getUnlockedGames (games) {
        return games.filter(game => !game.locked);
    }
    
    static lockAll (games) {
        return games.forEach((element, index, list) => GamesHelpers.lockGame(list, index));
    }
    
    static lockCompletelySortedGames (games, matchups) {
        for(var i = 0; i < games.length; i++)
        {
            var gamesRankedLowerCount = matchups.getAllRankedLower(games[i].id).length;
            var gamesUnlockedExcludingCurrentGameCount = GamesHelpers.getUnlockedGames(games).length - 1;
            
            if(!games[i].locked && gamesRankedLowerCount == gamesUnlockedExcludingCurrentGameCount) {
                games = GamesHelpers.lockGame(games, i);
            } else {
                break;
            }
        }
        
        for(var i = games.length - 1; i >= 0; i--)
        {
            var gamesRankedHigherCount = matchups.getAllRankedHigher(games[i].id).length;
            var gamesUnlockedExcludingCurrentGameCount = GamesHelpers.getUnlockedGames(games).length - 1;
            
            if(!games[i].locked && gamesRankedHigherCount == gamesUnlockedExcludingCurrentGameCount) {
                games = GamesHelpers.lockGame(games, i);
            } else {
                break;
            }
        }
        
        return games;
    }
    
    static lockGame (games, index) {
        var gameToLock = games[index];
        gameToLock.locked = true;
        games[index] = gameToLock;
        return games;
    }
    
    static logMatchup (matchups, winner, loser) {
        var match = new Matchup(winner, loser);
        
        matchups.add(match);
        
        return matchups;
    }
    
    static rankGames (list, game_matchups, gameIndex1, gameIndex2, isFirstBetter) {        
        if(isFirstBetter) {
            list[gameIndex1].wins += 1;
            list[gameIndex2].losses += 1;
            game_matchups = GamesHelpers.logMatchup(game_matchups, list[gameIndex1].id, list[gameIndex2].id);
            list = GamesHelpers.reposition(list, gameIndex1, gameIndex2);
        } else {
            list[gameIndex1].losses += 1;
            list[gameIndex2].wins += 1;
            game_matchups = GamesHelpers.logMatchup(game_matchups, list[gameIndex2].id, list[gameIndex1].id);
            list = GamesHelpers.reposition(list, gameIndex2, gameIndex1);
        }
        
        list[gameIndex1].rankedThisIteration = true;
        list[gameIndex2].rankedThisIteration = true;
        list = GamesHelpers.lockCompletelySortedGames(list, game_matchups);
        
        return {list, game_matchups};
    }
    
    static reposition (games, winnerIndex, loserIndex) {
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
                    if(games[i].locked || gamesRankedAboveWinner.indexOf(games[i].id) > -1) {
                        newPosition = i + 1;
                        break;
                    } else {
                        games[i].position += 1;
                    }
                }
                
                games[winnerIndex].position = newPosition;
            }
            
            if(loser.differential() < 0)
            {
                var newPosition = loser.position - loser.differential();
                
                for(var i = loserPosition + 1; i <= newPosition; i++) {
                    if(games[i].locked || gamesRankedBelowLoser.indexOf(games[i].id) > -1) {
                        newPosition = i - 1;
                        break;
                    } else {
                        games[i].position -= 1;
                    }
                }
                
                games[loserIndex].position = newPosition;
            }
        } else {
            games.map(item => {
                if(item.position >= loserPosition && item.position < winnerPosition)
                    item.position += 1;
            });
            
            games[winnerIndex].position = loserPosition;
        }
        
        return games;
    }
    
    static unlockAll (games) {
        for (var i = 0; i < games.length; i++) {
            games[i].locked = false;
            games[i].rankedThisIteration = false;
        }
        return games;
    }
    
    static unlockGame (games, index) {
        var gameToLock = games[index];
        gameToLock.locked = false;
        games[index] = gameToLock;
        return games;
    }
}



/**
 * A collection of games.
 * @class
 * @param {array} list - An array of games.
 */
class Games {
    constructor (list) {
        this.list = list;
        this.game_matchups = new Matchups();
    }
    
    doesMatchupRemain () {
        return this.list.filter(game => !game.rankedThisIteration && !game.locked).length >= 2;
    }
    
    getFlickchartMatchup () {
        // If there's only one game to sort, it is already sorted
        if (this.list.length <= 1) {
            this.list = GamesHelpers.lockAll(this.list);
        } else {
            if (!this.doesMatchupRemain()) {
                // All games have been visited at least once, start over
                this.list = GamesHelpers.unlockAll(this.list);
            }
            if (this.doesMatchupRemain()) {
                var game1 = this.getFirstNotLockedOrRanked();
                var game1Index = this.list.indexOf(game1);
                var game2 = this.getOpponent(this.list, game1, this.game_matchups);
                var game2Index = this.list.indexOf(game2);
                
                return new Battle(game1, game2, game1Index, game2Index);
            }
        }
        
        return new Battle();
    }
    
    setFlickchartMatchup (battleResult) {
        var {list, game_matchups} = GamesHelpers.rankGames(
            this.list, 
            this.game_matchups, 
            battleResult.game1Index, 
            battleResult.game2Index, 
            battleResult.winnerIndex);
        this.list = list;
        this.game_matchups = game_matchups;
        this.sortList();
        
        console.log(this.game_matchups.toString());
    }
    
    getFirstNotLockedOrRanked () {
        return this.list.find(game => !game.locked && !game.rankedThisIteration);
    }
    
    getOpponent (games, game1, matchups) {
        var game2 = games.find(game => 
          !game.locked && 
          !game.rankedThisIteration && 
          game.id !== game1.id && 
          !matchups.isRanked(game1.id, game.id)
        );
        
        if (game2 === undefined) {
            game2 = games.find(game => !game.locked && game.id !== game1.id && !matchups.isRanked(game1.id, game.id));
        }
        
        // If game2 is still undefined, then all possible matchups have been evaluated
        if (game2 === undefined) {
            console.warn("Thomas: All possible matchups have been evaluated by the user.");
        }
                
        return game2;
    }
    
    quickSort () {
        
    }
    
    sortList () {
        this.list.sort(GamesHelpers.compareGames);
    }
    
    addGame (game) {
        this.list.push(game);
    }
    
    /**
    * ToString for games.
    * @method
    */
    toString () {
        return this.list.toString();
    }
}



/**
 * A matchup of two games.
 * @class
 * @param {string} winner - The winner of the matchup.
 * @param {string} loser - The loser of the matchup.
 */
class Matchup {
    constructor (winner, loser) {
        this.winner = winner;
        this.loser = loser;
    }
    
    /**
    * ToString for a matchup.
    * @method
    */
    toString () {
        return this.winner + '>' + this.loser;
    }
}



/**
 * A collection of matchups.
 * @class
 */
class Matchups {
    constructor () {
        this.list = [];
    }

    add (matchup) {
        this.list.push(matchup);
    }
    
    //todo: pass in list as parameter
    getAllRankedLower (id, includeId) {
        if (includeId == undefined)
            includeId = false;
        
        var self = this;
        
        var losers = self.list.map(function(item){
            if (item.winner == id) 
                return item.loser;
        }).filter(item => item);
        
        if (losers.length == 0) {
            return includeId ? [id] : [];
        } else {
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
    getAllRankedHigher (id, includeId) {
        if (includeId == undefined)
            includeId = false;
        
        var self = this;
        
        var winners = self.list.map(function(item){
            if (item.loser == id) 
                return item.winner;
        }).filter(item => item);
        
        if (winners.length == 0) {
            return includeId ? [id] : [];
        } else {
            var parents = winners.map(function(item) {
                return self.getAllRankedHigher(item, true);
            });
            
            winners = winners.concat(_.flatten(parents));
            
            if(includeId)
                winners.push(id);
            
            return _.uniq(winners);
        }
    }
    
    isRanked (gameId1, gameId2) {
        var self = this;
        
        var higher = self.getAllRankedHigher(gameId1);
        var lower = self.getAllRankedLower(gameId1);
        var all = higher.concat(lower);
        
        return _.contains(all, gameId2);
    }

    /**
    * ToString for matchups.
    * @method
    */    
    toString () {
        return this.list.toString();
    }
}



class Thomas {
    constructor () {
        this.games_object = new Games([]);
        this.process_pipeline = new Array();
        this.process_running = false;
    }
    
    // private
    _push_pipeline (action) {
        this.process_pipeline.push(action);
        if (!this.process_running) {
            this.process_running = true;
            this._run_pipeline();
        }
    }
    
    _run_pipeline () {
        if (this.process_pipeline.length) {
            // Dequeue and execute
            this.process_pipeline.shift()();
        } else {
            this.process_running = false; 
        }
    }
    
    // public
    addGame (game_name) {
        this._push_pipeline( () => {
            this.games_object.addGame(new Game(this.games_object.list.length, -1, game_name));
            this._run_pipeline();
        });
        return this;
    }
    
    closePrompt () {  
        document.getElementById("thomas-dialog").style.display = "none";
    }
        
    debug () {
        this._push_pipeline( () => {
            console.log(this.games_object.toString());
            this._run_pipeline();
        });
        return this;
    }
    
    getComparison () {
        // NOT async
        var fc = this.games_object.getFlickchartMatchup();
        if (!fc.isNull) {
            return fc;
        } else {
            console.warn("Thomas: Cannot generate comparison.");
        }
    }
    
    promptComparison () {
        this._push_pipeline( () => {
            var comp = this.getComparison();
            if (comp !== undefined && comp.game1 !== undefined && comp.game2 !== undefined) {
                this.promptUser("Which game do you prefer?", [ 
                    { 
                        text: comp.game1.name, 
                        click: () => { 
                            this.setComparison(comp, 1);
                            this._run_pipeline(); 
                        } 
                    }, 
                    { 
                        text: comp.game2.name, 
                        click: () => { 
                            this.setComparison(comp, 2);
                            this._run_pipeline(); 
                        } 
                    } 
                ]); 
            } else {
                this._run_pipeline(); 
            }
        });
        return this;
    }
    
    // Prompt the user with a message and present multiple options.
    // Message: the message to prompt the user
    // Buttons: an array of object of the form { text: "link text", click: function() { /* action */ } }
    promptUser (message, buttons) {
        if (document.getElementById("thomas-dialog") != null) {
            var el = document.getElementById("thomas-dialog");
            el.parentNode.removeChild(el);
        }
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
            buttonsHtml += '<a id="' + buttons[i].buttonId + '" onclick="test.closePrompt()" href="javascript: void(0)">' + buttons[i].text + '</a>';
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
        
    setComparison (comparison, selection) {
        // NOT async
        if (selection == 1 || selection == 2) {
            comparison.winnerIndex = selection;
            this.games_object.setFlickchartMatchup(comparison);
        } else {
            console.warn("Thomas: Selection must be either 1 or 2.")
        }
        return this;
    }
}



/**************************************************************
    METHODS
**************************************************************/
var getGames = function() {
    // todo: get user input
    
    var games = [];
    var i, j;
    
    for(i = 1, j = 10; i <= 10; i++, j--) {
        games.push(new Game(i, j));
    }
    
    return games;
}



/**************************************************************
    TEMP MAIN
**************************************************************/
var test = new Thomas();

test.addGame('llama').addGame('sushi').addGame('taco').addGame('chocolate');
test.debug();

test.promptComparison();
test.promptComparison();
test.promptComparison();
test.promptComparison();
test.promptComparison();
test.promptComparison();

test.debug();
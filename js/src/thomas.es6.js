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
 * Static utility methods for Games.
 * @class
 */
class GamesUtilities {
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
        return games.forEach((element, index, list) => GamesUtilities.lockGame(list, index));
    }
    
    static lockCompletelySortedGames (games, matchups) {
        for(let i = 0; i < games.length; i++)
        {
            const gamesRankedLowerCount = matchups.getAllRankedLower(games[i].id).length;
            const gamesUnlockedExcludingCurrentGameCount = GamesUtilities.getUnlockedGames(games).length - 1;
            
            if(!games[i].locked && gamesRankedLowerCount == gamesUnlockedExcludingCurrentGameCount) {
                games = GamesUtilities.lockGame(games, i);
            } else {
                break;
            }
        }
        
        for(let i = games.length - 1; i >= 0; i--)
        {
            const gamesRankedHigherCount = matchups.getAllRankedHigher(games[i].id).length;
            const gamesUnlockedExcludingCurrentGameCount = GamesUtilities.getUnlockedGames(games).length - 1;
            
            if(!games[i].locked && gamesRankedHigherCount == gamesUnlockedExcludingCurrentGameCount) {
                games = GamesUtilities.lockGame(games, i);
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
            game_matchups = GamesUtilities.logMatchup(game_matchups, list[gameIndex1].id, list[gameIndex2].id);
            list = GamesUtilities.reposition(list, gameIndex1, gameIndex2);
        } else {
            list[gameIndex1].losses += 1;
            list[gameIndex2].wins += 1;
            game_matchups = GamesUtilities.logMatchup(game_matchups, list[gameIndex2].id, list[gameIndex1].id);
            list = GamesUtilities.reposition(list, gameIndex2, gameIndex1);
        }
        
        list[gameIndex1].rankedThisIteration = true;
        list[gameIndex2].rankedThisIteration = true;
        list = GamesUtilities.lockCompletelySortedGames(list, game_matchups);
        
        return {list, game_matchups};
    }
    
    static reposition (games, winnerIndex, loserIndex) {
        const winnerPosition = games[winnerIndex].position;
        const loserPosition = games[loserIndex].position;
        
        // if winner is positioned above loser
        if(winnerPosition < loserPosition) {
            const winner = games[winnerIndex];
            const loser = games[loserIndex];
            
            if(winner.differential() > 0) {
                let newPosition = winner.position - winner.differential();
                const gamesRankedAboveWinner = getAllRankedHigher(winner.id);
                
                for(let i = winnerPosition  - 1; i >= newPosition; i--) {
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
                let newPosition = loser.position - loser.differential();
                const gamesRankedBelowLoser = getAllRankedLower(loser.id);
                
                for(let i = loserPosition + 1; i <= newPosition; i++) {
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
        for (let i = 0; i < games.length; i++) {
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
            this.list = GamesUtilities.lockAll(this.list);
        } else {
            if (!this.doesMatchupRemain()) {
                // All games have been visited at least once, start over
                this.list = GamesUtilities.unlockAll(this.list);
            }
            if (this.doesMatchupRemain()) {
                const game1 = this.getFirstNotLockedOrRanked();
                const game1Index = this.list.indexOf(game1);
                const game2 = this.getOpponent(this.list, game1, this.game_matchups);
                const game2Index = this.list.indexOf(game2);
                
                return new Battle(game1, game2, game1Index, game2Index);
            }
        }
        
        return new Battle();
    }
    
    setFlickchartMatchup (battleResult) {
        const {list, game_matchups} = GamesUtilities.rankGames(
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
            console.warn('Thomas: All possible matchups have been evaluated by the user.');
        }
                
        return game2;
    }
    
    quickSort () {
        
    }
    
    sortList () {
        this.list.sort(GamesUtilities.compareGames);
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
 * A class to hold static utilities e.g. for arrays
 * @class
 */
class Utilities {
    /**
     * Move all items from nested arrays to the top-level array.
     * @method
     * @param {array} list - The array to flatten.
     */
    static flattenArray (list) {
      return list.reduce(
        (a, b) => a.concat(Array.isArray(b) ? Utilities.flattenArray(b) : b), []
      );   
    }
    
    /**
     * Remove all duplicate items from an array.
     * @method
     * @param {array} list - The array from which to remove duplicates.
     */
    static uniqueArray (list) {
        return list.filter( (value, index) => list.indexOf(value) === index);
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
        
        var losers = this.list.map(item => item.winner === id ? item.loser : undefined).filter(item => item);
        
        if (losers.length == 0) {
            return includeId ? [id] : [];
        } else {
            const children = losers.map(item => this.getAllRankedLower(item, true));
            
            losers = losers.concat(Utilities.flattenArray(children));
            
            if(includeId)
                losers.push(id);
            
            return Utilities.uniqueArray(losers);
        }
    }
    
    //todo: pass in list as parameter
    getAllRankedHigher (id, includeId) {
        if (includeId == undefined)
            includeId = false;
        
        var winners = this.list.map(item => item.loser === id ? item.winner : undefined).filter(item => item);
        
        if (winners.length == 0) {
            return includeId ? [id] : [];
        } else {
            const parents = winners.map(item => this.getAllRankedHigher(item, true));
            
            winners = winners.concat(Utilities.flattenArray(parents));
            
            if(includeId)
                winners.push(id);
            
            return Utilities.uniqueArray(winners);
        }
    }
    
    isRanked (gameId1, gameId2) {
        const higher = this.getAllRankedHigher(gameId1);
        const lower = this.getAllRankedLower(gameId1);
        const all = [...higher, ...lower];
        
        return all.indexOf(gameId2) > -1;
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
        document.getElementById('thomas-dialog').style.display = 'none';
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
        const fc = this.games_object.getFlickchartMatchup();
        if (!fc.isNull) {
            return fc;
        } else {
            console.warn('Thomas: Cannot generate comparison.');
        }
    }
    
    promptComparison () {
        this._push_pipeline( () => {
            const comp = this.getComparison();
            if (comp !== undefined && comp.game1 !== undefined && comp.game2 !== undefined) {
                this.promptUser('Which game do you prefer?', [ 
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
        if (document.getElementById('thomas-dialog') != null) {
            let el = document.getElementById('thomas-dialog');
            el.parentNode.removeChild(el);
        }
        var appendHtml = function (el, str) {
            let div = document.createElement('div');
            div.innerHTML = str;
            while (div.children.length > 0) {
                el.appendChild(div.children[0]);
            }
        };
        
        // Generate a list of buttons (reverse iterate since we're floating elements right)
        var buttonsHtml = '';
        var buttonEvents = new Array();
        for (let i = buttons.length - 1; i >= 0; i--) {
            buttons[i].buttonId = `thomas-dialog-opt-${i}`;
            buttonsHtml += `<a id="${buttons[i].buttonId}" onclick="test.closePrompt()" href="javascript: void(0)">${buttons[i].text}</a>`;
        }
        
        appendHtml(document.body,
`<div id="thomas-dialog">
    <div id="thomas-dialog-content">
        <p>${message}</p>
        <div>${buttonsHtml}</div>
    </div>
</div>`);
            
        // Add events to buttons after adding them to the DOM
        for (let i = 0; i < buttons.length; i++) {
            document.getElementById(buttons[i].buttonId).addEventListener('click', buttons[i].click);
        }
    }
        
    setComparison (comparison, selection) {
        // NOT async
        if (selection == 1 || selection == 2) {
            comparison.winnerIndex = selection;
            this.games_object.setFlickchartMatchup(comparison);
        } else {
            console.warn('Thomas: Selection must be either 1 or 2.')
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
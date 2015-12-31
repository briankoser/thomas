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
class Comparison {
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
 * The result of comparing two games.
 * @class
 * @param {string} winner - The winner of the comparison.
 * @param {string} loser - The loser of the comparison.
 */
class ComparisonResult {
    constructor (winner, loser) {
        this.winner = winner;
        this.loser = loser;
    }
    
    /**
    * ToString for a matchup.
    * @method
    * @returns {string} string representation of a ComparisonResult
    */
    toString () {
        return this.winner + '>' + this.loser;
    }
}



/**
 * A collection of comparisons.
 * @class
 */
class Comparisons {
    constructor () {
        this.list = [];
    }

    /**
     * Adds a comparison to the internal list.
     * @method
     * @param {Comparison} comparison - A Comparison
     */
    add (comparison) {
        this.list.push(comparison);
    }
    
    //todo: pass in list as parameter
    /**
     * Get all games that have won a comparison again the game. Comparisons are commutative, 
     * so if e.g. game1 won a comparison against game2 and game2 won against game3,
     * game1 would be included as a winner against game3.
     * @method
     * @param {int} id - The id of the game to get winners for.
     * @param {boolean} includeId - If true, include the id of the game in the list of winners (default is "false").
     * @returns {array} collection of games 
     */
    getAllRankedHigher (id, includeId = false) {
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
    
    //todo: pass in list as parameter
    /**
     * Get all games that have lost a comparison again the game. Comparisons are commutative, 
     * so if e.g. game1 lost a comparison against game2 and game2 lost against game3,
     * game1 would be included as a loser against game3.
     * @method
     * @param {int} id - The id of the game to get losers for.
     * @param {boolean} includeId - If true, include the id of the game in the list of losers (default is "false").
     * @returns {array} collection of games 
     */
    getAllRankedLower (id, includeId = false) {
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
    
    /**
     * Checks if two games have been compared. Comparisons are commutative, 
     * so if e.g. game1 won a comparison against game2 and game2 won against game3,
     * game1 and game3 would be considered to have been compared. 
     * @method
     * @param {int} gameId1 - The id of the first game to check for comparison.
     * @param {int} gameId2 - The id of the second game to check for comparison.
     * @returns {boolean} true if games have been compared, else false
     */
    haveBeenCompared (gameId1, gameId2) {
        const higher = this.getAllRankedHigher(gameId1);
        const lower = this.getAllRankedLower(gameId1);
        const all = [...higher, ...lower];
        
        return all.indexOf(gameId2) > -1;
    }

    /**
    * ToString for matchups.
    * @method
    * @returns {string} string representation of a Comparisons object
    */
    toString () {
        return this.list.toString();
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
        this.comparedThisIteration = false;
    }
    
    /**
     * The differential is a measure of how many times a game has won vs. how many times it has lost. 
     * This is useful, e.g., in determining that a game is positioned much higher (low differential)
     * or much lower (high differential) that it's true ranking.
     * @method
     * @returns {int} the game's differential 
     */
    differential () {
        return this.wins - this.losses;
    }
    
    /**
    * ToString for matchups.
    * @method
    * @returns {string} string representation of a Game
    */
    toString () {
        return this.name;
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
        this.comparisons = new Comparisons();
    }
    
    /**
     * Add a Game to the internal Games collection.
     * @method
     * @param {game} game - The game to add to the internal Games collection.
     */
    add (game) {
        this.list.push(game);
    }
    
    
    doesComparisonRemain () {
        return this.list.filter(game => !game.comparedThisIteration && !game.locked).length >= 2;
    }
    
    getFlickchartComparison () {
        // If there's only one game to sort, it is already sorted
        if (this.list.length <= 1) {
            this.list = GamesUtilities.lockAll(this.list);
        } else {
            if (!this.doesComparisonRemain()) {
                // All games have been visited at least once, start over
                this.list = GamesUtilities.unlockAll(this.list);
            }
            if (this.doesComparisonRemain()) {
                const game1 = this.getFirstNotLockedOrCompared();
                const game1Index = this.list.indexOf(game1);
                const game2 = this.getOpponent(this.list, game1, this.comparisons);
                const game2Index = this.list.indexOf(game2);
                
                return new Comparison(game1, game2, game1Index, game2Index);
            }
        }
        
        return new Comparison();
    }
    
    getFirstNotLockedOrCompared () {
        return this.list.find(game => !game.locked && !game.comparedThisIteration);
    }
    
    // todo: refactor game2 search to be DRY
    getOpponent (games, game1, comparisons) {
        var game2 = games.find(game => 
            !game.locked && 
            !game.comparedThisIteration && 
            game.id !== game1.id && 
            !comparisons.haveBeenCompared(game1.id, game.id)
        );
        
        if (game2 === undefined) {
            game2 = games.find(game => !game.locked && 
                game.id !== game1.id && 
                !comparisons.haveBeenCompared(game1.id, game.id)
            );
        }
        
        // If game2 is still undefined, then all possible comparisons have been evaluated
        if (game2 === undefined) {
            console.warn('Thomas: All possible comparisons have been compared by the user.');
            // todo: does this need to be handled somehow?
        }
                
        return game2;
    }
    
    // todo: implement quicksort to complement flickchart sort
    quickSort () {
        
    }
    
    setFlickchartComparison (comparison) {
        const {list, comparisons} = GamesUtilities.rankGames(
            this.list, 
            this.comparisons, 
            comparison.game1Index, 
            comparison.game2Index, 
            comparison.winnerIndex);
        this.list = list;
        this.comparisons = comparisons;
        this.sortList();
        
        console.log(this.comparisons.toString());
    }
    
    sortList () {
        this.list.sort(GamesUtilities.compareGamesPosition);
    }
    
    /**
    * ToString for games.
    * @method
    * @returns {string} string representation of a Games object
    */
    toString () {
        return this.list.toString();
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
    static compareGamesPosition (game1, game2) {
        return game1.position - game2.position;
    }
    
    static getUnlockedGames (games) {
        return games.filter(game => !game.locked);
    }
    
    static lockAll (games) {
        return games.forEach((element, index, list) => GamesUtilities.lockGame(list, index));
    }
    
    static lockCompletelySortedGames (games, comparisons) {
        for(let i = 0; i < games.length; i++)
        {
            const gamesRankedLowerCount = comparisons.getAllRankedLower(games[i].id).length;
            const gamesUnlockedExcludingCurrentGameCount = GamesUtilities.getUnlockedGames(games).length - 1;
            
            if(!games[i].locked && gamesRankedLowerCount == gamesUnlockedExcludingCurrentGameCount) {
                games = GamesUtilities.lockGame(games, i);
            } else {
                break;
            }
        }
        
        for(let i = games.length - 1; i >= 0; i--)
        {
            const gamesRankedHigherCount = comparisons.getAllRankedHigher(games[i].id).length;
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
    
    static logComparison (comparisons, winner, loser) {
        var comparison = new ComparisonResult(winner, loser);
        comparisons.add(comparison);
        return comparisons;
    }
    
    static rankGames (list, comparisons, gameIndex1, gameIndex2, winnerIndex) {
        if(winnerIndex == 1) {
            list[gameIndex1].wins += 1;
            list[gameIndex2].losses += 1;
            comparisons = GamesUtilities.logComparison(comparisons, list[gameIndex1].id, list[gameIndex2].id);
            list = GamesUtilities.reposition(list, gameIndex1, gameIndex2);
        } else {
            list[gameIndex1].losses += 1;
            list[gameIndex2].wins += 1;
            comparisons = GamesUtilities.logComparison(comparisons, list[gameIndex2].id, list[gameIndex1].id);
            list = GamesUtilities.reposition(list, gameIndex2, gameIndex1);
        }
        
        list[gameIndex1].comparedThisIteration = true;
        list[gameIndex2].comparedThisIteration = true;
        list = GamesUtilities.lockCompletelySortedGames(list, comparisons);
        
        return {list, comparisons};
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
                const gamesRankedAboveWinner = games.getAllRankedHigher(winner.id);
                
                for(let i = winnerPosition - 1; i >= newPosition; i--) {
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
                const gamesRankedBelowLoser = games.getAllRankedLower(loser.id);
                
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
            games[i].comparedThisIteration = false;
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
 * Thomas sorts a list of games according to user input.
 * @class
 */
class Thomas {
    constructor () {
        this.games = new Games([]);
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
    addGame (name) {
        this._push_pipeline( () => {
            this.games.add(new Game(this.games.list.length, -1, name));
            this._run_pipeline();
        });
        return this;
    }
    
    addGamesFromFile (onLoadCallback) {
        // This method MUST be called from the user context (e.g., click event) or nothing will happen.
        try {
            var fileInput = document.createElement('input');
            fileInput.type = "file";
            fileInput.style.position = "fixed";
            fileInput.style.top = "-1000px";
            fileInput.onchange = e => {
                var gameFile = fileInput.files[0];
                if (gameFile) {
                    var reader = new FileReader();
                    reader.readAsText(gameFile, "UTF-8");
                    reader.onload = event => {
                        try {
                            var games = event.target.result.replace(/\r/g, '').split('\n');
                            for (var i = 0; i < games.length; i++) {
                                // console.log('Thomas: Loaded ' + games[i]);
                                console.log(this);
                                this.games.add(new Game(this.games.list.length, -1, games[i]));
                            }
                        } catch (err) {
                            console.warn('Thomas: Error parsing games from file!');
                            console.warn(err);
                        }
                        if (typeof onLoadCallback === 'function') {
                            onLoadCallback();
                        }
                    }
                    reader.onerror = () => console.warn('Thomas: Error loading file!');
                }
            }
            document.body.appendChild(fileInput);
            fileInput.click();
        } catch (ex) {
            console.warn('Thomas: Error loading file!');
            this._run_pipeline();
        }
    }
    
    closePrompt () {  
        document.getElementById('thomas-dialog').style.display = 'none';
    }
        
    debug () {
        this._push_pipeline( () => {
            console.log(this.games.toString());
            this._run_pipeline();
        });
        return this;
    }
    
    getComparison () {
        // NOT async
        const fc = this.games.getFlickchartComparison();
        if (!fc.isNull) {
            return fc;
        } else {
            console.warn('Thomas: Cannot generate comparison.');
        }
    }
    
    promptComparison () {
        this._push_pipeline( () => {
            const comparison = this.getComparison();
            if (comparison !== undefined && comparison.game1 !== undefined && comparison.game2 !== undefined) {
                this.promptUser('Which game do you prefer?', [ 
                    { 
                        text: comparison.game1.name, 
                        click: () => { 
                            this.setComparison(comparison, 1);
                            this._run_pipeline(); 
                        } 
                    }, 
                    { 
                        text: comparison.game2.name, 
                        click: () => { 
                            this.setComparison(comparison, 2);
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
            this.games.setFlickchartComparison(comparison);
        } else {
            console.warn('Thomas: Selection must be either 1 or 2.')
        }
        return this;
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



/**************************************************************
    TEMP MAIN
**************************************************************/
var test = new Thomas();

var runTests = function () {
    test.addGame('llama').addGame('sushi').addGame('taco').addGame('chocolate');
    
    test.debug();
    
    test.promptComparison();
    test.promptComparison();
    test.promptComparison();
    test.promptComparison();
    test.promptComparison();
    test.promptComparison();
    
    test.debug();
};
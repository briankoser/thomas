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
 */
class Comparison {
    constructor (game1, game2, game1Index, game2Index) {
        this.game1 = game1;
        this.game2 = game2;
        this.game1Index = game1Index;
        this.game2Index = game2Index;
        this.isNull = game1 == undefined;
        this.result = null;
    }
}



/**
 * The result of comparing two games.
 * @class
 * @param {int} winnerId - The id of the winner of the comparison.
 * @param {int} loserId - The id of the loser of the comparison.
 */
class ComparisonResult {
    constructor (winnerId, loserId) {
        this.winnerId = winnerId;
        this.loserId = loserId;
    }
    
    /**
    * ToString for a matchup.
    * @method
    * @returns {string} string representation of a ComparisonResult
    */
    toString () {
        return this.winnerId + '>' + this.loserId;
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
     * Add a comparison to the internal list.
     * @method
     * @param {object} comparison - A Comparison object
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
        var winners = this.list.map(item => item.result.loserId === id ? item.result.winnerId : undefined)
            .filter(item => item);
        
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
        var losers = this.list.map(item => item.result.winnerId === id ? item.result.loserId : undefined)
            .filter(item => item);
        
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
     * Check if two games have been compared. Comparisons are commutative, 
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
     * @param {object} game - The Game object to add to the internal Games collection.
     */
    add (game) {
        this.list.push(game);
    }
    
    /**
     * Check if at least two unlocked, un-compared (this iteration) games exist.
     * @method
     * @returns {boolean} True if a comparison remains, else false
     */
    doesComparisonRemain () {
        return this.list.filter(game => !game.comparedThisIteration && !game.locked).length >= 2;
    }
    
    /**
     * Get the next two games for the Thomas to compare.
     * @method
     * @returns {object} Comparison object
     */
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
    
    /**
     * Get the first Game (positionally) that hasn't been locked or compared this iteration.
     * @method
     * @return {object} The Game object to add to the internal Games collection.
     */
    getFirstNotLockedOrCompared () {
        return this.list.find(game => !game.locked && !game.comparedThisIteration);
    }
    
    // todo: refactor game2 search to be DRY
    /**
     * Get a game to be compared to a provided game. The returned game should not be locked, 
     * already compared to the provided game, the provided game itself, and (if possible) not 
     * already compared this iteration.
     * @method
     * @param {array} games - The list of games that need to be compared.
     * @param {object} game1 - The game object to find a comparison for.
     * @param {object} comparisons - The Comparisons object where Comparisons are stored.
     * @return {object} The Game object to compare to the provided Game.
     */
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
    
    /**
     * Save a comparison and re-sort the Games list.
     * @method
     * @param {object} comparison - The Comparison object containing the comparison to save.
     * @param {int} selection - 1 if game 1 won the comparison, 2 if game 2 won the comparison.
     */
    setFlickchartComparison (comparison, selection) {
        var list = this.list;
        var comparisons = this.comparisons;
                
        var winnerIndex = comparison === 1 ? comparison.game1Index : comparison.game2Index;
        var loserIndex = winnerIndex === 1 ? 2 : 1;
        
        list[winnerIndex] = GameUtilities.incrementWins(list[winnerIndex]);
        list[loserIndex] = GameUtilities.incrementLosses(list[loserIndex]);
        
        var comparisonResult = new ComparisonResult(list[winnerIndex].id, list[loserIndex].id);
        comparison.result = comparisonResult;
        comparisons.add(comparison);
        
        list[comparison.game1Index].comparedThisIteration = true;
        list[comparison.game2Index].comparedThisIteration = true;
        
        list = GamesUtilities.reposition(list, winnerIndex, loserIndex);
        list = GamesUtilities.sortList(list);
        list = GamesUtilities.lockCompletelySortedGames(list, comparisons);
        
        console.log(comparisons.toString());
        
        this.list = list;
        this.comparisons = comparisons;
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
class GameUtilities {
    /**
     * Increment the losses counter of a Game. 
     * @method
     * @param {object} game - The Game to increment losses.
     * @return {object} The updated Game.
     */
    static incrementLosses(game) {
        game.losses -= 1;
        return game;
    }
    
    /**
     * Increment the wins counter of a Game. 
     * @method
     * @param {object} game - The Game to increment wins.
     * @return {object} The updated Game.
     */
    static incrementWins(game) {
        game.wins -= 1;
        return game;
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
     * @param {object} game1 - The first Game object to compare by position.
     * @param {object} game2 - The second Game object to compare by position.
     * @returns Positive integer if game 1 has a higher position than game 2.
     * Negative integer if game 1 has a lower position than game 2. 
     * 0 if both games have the same position (which should never happen).
     */
    static compareGamesPosition (game1, game2) {
        return game1.position - game2.position;
    }
    
    /**
     * Get all unlocked games from a list of Games. 
     * @method
     * @param {array} games - A list of Game objects.
     * @return {array} The Games from the that are unlocked.
     */
    static getUnlockedGames (games) {
        return games.filter(game => !game.locked);
    }
    
    /**
     * Lock all Games in a list of Games. 
     * @method
     * @param {array} games - A list of Game objects.
     * @return {array} The Games provided, locked..
     */
    static lockAll (games) {
        return games.forEach((element, index, list) => GamesUtilities.lockGame(list, index));
    }
    
    /**
     * Finds all Games that are completely sorted and locks them. A Game is completely sorted if it 
     * has directly or indirectly been compared to all other Games in a list. 
     * @method
     * @param {array} games - A list of Games.
     * @param {object} comparison - A Comparisons object.
     * @return {array} The Games list, with completely sorted Games locked.
     */
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
    
    /**
     * Lock a game. Locked games are completely sorted; their position is fixed. 
     * @method
     * @param {array} games - A list of Games.
     * @param {int} index - The index of the Game in the list of Games to be locked.
     * @return {array} The list of Games with the Game locked at the provided index.
     */
    static lockGame (games, index) {
        var gameToLock = games[index];
        gameToLock.locked = true;
        games[index] = gameToLock;
        return games;
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
    
    /**
     * Sort the internal Game list by position.
     * @method
     * @param {array} list - List of Games to sort by position.
     * @return {array} Sorted list of Games.
     */
    static sortList (list) {
        return list.sort(GamesUtilities.compareGamesPosition);
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
    // todo: add options parameter
    // todo: add option for defining sort type (flickchart, quicksort)
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
        if (selection === 1 || selection === 2) {
            this.games.setFlickchartComparison(comparison, selection);
        } else {
            console.warn('Thomas: Selection must be either 1 or 2.')
        }
        return this;
    }
    
    // todo: implement sortCompletely()
    // sortCompletely() {
    //     promptUser().then( (response) => {
    //         saveResponse(response);
    //         updateDisplay();
    //         
    //         if(!isSorted()) setTimeout(sortCompletely, 0);
    //     })
    // }
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
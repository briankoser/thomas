"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var Battle = function Battle(game1, game2, game1Index, game2Index, winner) {
    _classCallCheck(this, Battle);

    this.game1 = game1;
    this.game2 = game2;
    this.game1Index = game1Index;
    this.game2Index = game2Index;
    this.winnerIndex = winner;
    this.isNull = game1 == undefined;
};

/**
 * A board game with rank information.
 * @class
 * @param {int} id - A unique id.
 * @param {int} position - The current position in the ranked list.
 * @param {string} name - The name of the game.
 */

var Game = (function () {
    function Game(id, position, name) {
        _classCallCheck(this, Game);

        this.id = id;
        this.position = position;
        this.name = name;
        this.wins = 0;
        this.losses = 0;
        this.locked = false;
        this.rankedThisIteration = false;
    }

    _createClass(Game, [{
        key: "differential",
        value: function differential() {
            return this.wins - this.losses;
        }
    }, {
        key: "toString",
        value: function toString() {
            return this.name;
        }
    }]);

    return Game;
})();

/**
 * Static utility methods for Games.
 * @class
 */

var GamesUtilities = (function () {
    function GamesUtilities() {
        _classCallCheck(this, GamesUtilities);
    }

    _createClass(GamesUtilities, null, [{
        key: "compareGames",

        /**
         * Compare the positions of two games.
         * @method
         * @param {game} game1 - The first game to compare by position.
         * @param {game} game2 - The second game to compare by position.
         * @returns 
         */
        value: function compareGames(game1, game2) {
            return game1.position - game2.position;
        }
    }, {
        key: "getUnlockedGames",
        value: function getUnlockedGames(games) {
            return games.filter(function (game) {
                return !game.locked;
            });
        }
    }, {
        key: "lockAll",
        value: function lockAll(games) {
            return games.forEach(function (element, index, list) {
                return GamesUtilities.lockGame(list, index);
            });
        }
    }, {
        key: "lockCompletelySortedGames",
        value: function lockCompletelySortedGames(games, matchups) {
            for (var i = 0; i < games.length; i++) {
                var gamesRankedLowerCount = matchups.getAllRankedLower(games[i].id).length;
                var gamesUnlockedExcludingCurrentGameCount = GamesUtilities.getUnlockedGames(games).length - 1;

                if (!games[i].locked && gamesRankedLowerCount == gamesUnlockedExcludingCurrentGameCount) {
                    games = GamesUtilities.lockGame(games, i);
                } else {
                    break;
                }
            }

            for (var i = games.length - 1; i >= 0; i--) {
                var gamesRankedHigherCount = matchups.getAllRankedHigher(games[i].id).length;
                var gamesUnlockedExcludingCurrentGameCount = GamesUtilities.getUnlockedGames(games).length - 1;

                if (!games[i].locked && gamesRankedHigherCount == gamesUnlockedExcludingCurrentGameCount) {
                    games = GamesUtilities.lockGame(games, i);
                } else {
                    break;
                }
            }

            return games;
        }
    }, {
        key: "lockGame",
        value: function lockGame(games, index) {
            var gameToLock = games[index];
            gameToLock.locked = true;
            games[index] = gameToLock;
            return games;
        }
    }, {
        key: "logMatchup",
        value: function logMatchup(matchups, winner, loser) {
            var match = new Matchup(winner, loser);
            matchups.add(match);
            return matchups;
        }
    }, {
        key: "rankGames",
        value: function rankGames(list, game_matchups, gameIndex1, gameIndex2, isFirstBetter) {
            if (isFirstBetter) {
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

            return { list: list, game_matchups: game_matchups };
        }
    }, {
        key: "reposition",
        value: function reposition(games, winnerIndex, loserIndex) {
            var winnerPosition = games[winnerIndex].position;
            var loserPosition = games[loserIndex].position;

            // if winner is positioned above loser
            if (winnerPosition < loserPosition) {
                var winner = games[winnerIndex];
                var loser = games[loserIndex];

                if (winner.differential() > 0) {
                    var newPosition = winner.position - winner.differential();
                    var gamesRankedAboveWinner = getAllRankedHigher(winner.id);

                    for (var i = winnerPosition - 1; i >= newPosition; i--) {
                        if (games[i].locked || gamesRankedAboveWinner.indexOf(games[i].id) > -1) {
                            newPosition = i + 1;
                            break;
                        } else {
                            games[i].position += 1;
                        }
                    }

                    games[winnerIndex].position = newPosition;
                }

                if (loser.differential() < 0) {
                    var newPosition = loser.position - loser.differential();
                    var gamesRankedBelowLoser = getAllRankedLower(loser.id);

                    for (var i = loserPosition + 1; i <= newPosition; i++) {
                        if (games[i].locked || gamesRankedBelowLoser.indexOf(games[i].id) > -1) {
                            newPosition = i - 1;
                            break;
                        } else {
                            games[i].position -= 1;
                        }
                    }

                    games[loserIndex].position = newPosition;
                }
            } else {
                games.map(function (item) {
                    if (item.position >= loserPosition && item.position < winnerPosition) item.position += 1;
                });

                games[winnerIndex].position = loserPosition;
            }

            return games;
        }
    }, {
        key: "unlockAll",
        value: function unlockAll(games) {
            for (var i = 0; i < games.length; i++) {
                games[i].locked = false;
                games[i].rankedThisIteration = false;
            }
            return games;
        }
    }, {
        key: "unlockGame",
        value: function unlockGame(games, index) {
            var gameToLock = games[index];
            gameToLock.locked = false;
            games[index] = gameToLock;
            return games;
        }
    }]);

    return GamesUtilities;
})();

/**
 * A collection of games.
 * @class
 * @param {array} list - An array of games.
 */

var Games = (function () {
    function Games(list) {
        _classCallCheck(this, Games);

        this.list = list;
        this.game_matchups = new Matchups();
    }

    _createClass(Games, [{
        key: "doesMatchupRemain",
        value: function doesMatchupRemain() {
            return this.list.filter(function (game) {
                return !game.rankedThisIteration && !game.locked;
            }).length >= 2;
        }
    }, {
        key: "getFlickchartMatchup",
        value: function getFlickchartMatchup() {
            // If there's only one game to sort, it is already sorted
            if (this.list.length <= 1) {
                this.list = GamesUtilities.lockAll(this.list);
            } else {
                if (!this.doesMatchupRemain()) {
                    // All games have been visited at least once, start over
                    this.list = GamesUtilities.unlockAll(this.list);
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
    }, {
        key: "setFlickchartMatchup",
        value: function setFlickchartMatchup(battleResult) {
            var _GamesUtilities$rankG = GamesUtilities.rankGames(this.list, this.game_matchups, battleResult.game1Index, battleResult.game2Index, battleResult.winnerIndex);

            var list = _GamesUtilities$rankG.list;
            var game_matchups = _GamesUtilities$rankG.game_matchups;

            this.list = list;
            this.game_matchups = game_matchups;
            this.sortList();

            console.log(this.game_matchups.toString());
        }
    }, {
        key: "getFirstNotLockedOrRanked",
        value: function getFirstNotLockedOrRanked() {
            return this.list.find(function (game) {
                return !game.locked && !game.rankedThisIteration;
            });
        }
    }, {
        key: "getOpponent",
        value: function getOpponent(games, game1, matchups) {
            var game2 = games.find(function (game) {
                return !game.locked && !game.rankedThisIteration && game.id !== game1.id && !matchups.isRanked(game1.id, game.id);
            });

            if (game2 === undefined) {
                game2 = games.find(function (game) {
                    return !game.locked && game.id !== game1.id && !matchups.isRanked(game1.id, game.id);
                });
            }

            // If game2 is still undefined, then all possible matchups have been evaluated
            if (game2 === undefined) {
                console.warn("Thomas: All possible matchups have been evaluated by the user.");
            }

            return game2;
        }
    }, {
        key: "quickSort",
        value: function quickSort() {}
    }, {
        key: "sortList",
        value: function sortList() {
            this.list.sort(GamesUtilities.compareGames);
        }
    }, {
        key: "addGame",
        value: function addGame(game) {
            this.list.push(game);
        }

        /**
        * ToString for games.
        * @method
        */

    }, {
        key: "toString",
        value: function toString() {
            return this.list.toString();
        }
    }]);

    return Games;
})();

/**
 * A class to hold static utilities e.g. for arrays
 * @class
 */

var Utilities = (function () {
    function Utilities() {
        _classCallCheck(this, Utilities);
    }

    _createClass(Utilities, null, [{
        key: "flattenArray",

        /**
         * Move all items from nested arrays to the top-level array.
         * @method
         * @param {array} list - The array to flatten.
         */
        value: function flattenArray(list) {
            return list.reduce(function (a, b) {
                return a.concat(Array.isArray(b) ? Utilities.flattenArray(b) : b);
            }, []);
        }

        /**
         * Remove all duplicate items from an array.
         * @method
         * @param {array} list - The array from which to remove duplicates.
         */

    }, {
        key: "uniqueArray",
        value: function uniqueArray(list) {
            return list.filter(function (value, index) {
                return list.indexOf(value) === index;
            });
        }
    }]);

    return Utilities;
})();

/**
 * A matchup of two games.
 * @class
 * @param {string} winner - The winner of the matchup.
 * @param {string} loser - The loser of the matchup.
 */

var Matchup = (function () {
    function Matchup(winner, loser) {
        _classCallCheck(this, Matchup);

        this.winner = winner;
        this.loser = loser;
    }

    /**
    * ToString for a matchup.
    * @method
    */

    _createClass(Matchup, [{
        key: "toString",
        value: function toString() {
            return this.winner + '>' + this.loser;
        }
    }]);

    return Matchup;
})();

/**
 * A collection of matchups.
 * @class
 */

var Matchups = (function () {
    function Matchups() {
        _classCallCheck(this, Matchups);

        this.list = [];
    }

    _createClass(Matchups, [{
        key: "add",
        value: function add(matchup) {
            this.list.push(matchup);
        }

        //todo: pass in list as parameter

    }, {
        key: "getAllRankedLower",
        value: function getAllRankedLower(id, includeId) {
            if (includeId == undefined) includeId = false;

            var self = this;

            var losers = self.list.map(function (item) {
                if (item.winner == id) return item.loser;
            }).filter(function (item) {
                return item;
            });

            if (losers.length == 0) {
                return includeId ? [id] : [];
            } else {
                var children = losers.map(function (item) {
                    return self.getAllRankedLower(item, true);
                });

                losers = losers.concat(Utilities.flattenArray(children));

                if (includeId) losers.push(id);

                return Utilities.uniqueArray(losers);
            }
        }

        //todo: pass in list as parameter

    }, {
        key: "getAllRankedHigher",
        value: function getAllRankedHigher(id, includeId) {
            if (includeId == undefined) includeId = false;

            var self = this;

            var winners = self.list.map(function (item) {
                if (item.loser == id) return item.winner;
            }).filter(function (item) {
                return item;
            });

            if (winners.length == 0) {
                return includeId ? [id] : [];
            } else {
                var parents = winners.map(function (item) {
                    return self.getAllRankedHigher(item, true);
                });

                winners = winners.concat(Utilities.flattenArray(parents));

                if (includeId) winners.push(id);

                return Utilities.uniqueArray(winners);
            }
        }
    }, {
        key: "isRanked",
        value: function isRanked(gameId1, gameId2) {
            var self = this;

            var higher = self.getAllRankedHigher(gameId1);
            var lower = self.getAllRankedLower(gameId1);
            var all = [].concat(_toConsumableArray(higher), _toConsumableArray(lower));

            return all.indexOf(gameId2) > -1;
        }

        /**
        * ToString for matchups.
        * @method
        */

    }, {
        key: "toString",
        value: function toString() {
            return this.list.toString();
        }
    }]);

    return Matchups;
})();

var Thomas = (function () {
    function Thomas() {
        _classCallCheck(this, Thomas);

        this.games_object = new Games([]);
        this.process_pipeline = new Array();
        this.process_running = false;
    }

    // private

    _createClass(Thomas, [{
        key: "_push_pipeline",
        value: function _push_pipeline(action) {
            this.process_pipeline.push(action);
            if (!this.process_running) {
                this.process_running = true;
                this._run_pipeline();
            }
        }
    }, {
        key: "_run_pipeline",
        value: function _run_pipeline() {
            if (this.process_pipeline.length) {
                // Dequeue and execute
                this.process_pipeline.shift()();
            } else {
                this.process_running = false;
            }
        }

        // public

    }, {
        key: "addGame",
        value: function addGame(game_name) {
            var _this = this;

            this._push_pipeline(function () {
                _this.games_object.addGame(new Game(_this.games_object.list.length, -1, game_name));
                _this._run_pipeline();
            });
            return this;
        }
    }, {
        key: "closePrompt",
        value: function closePrompt() {
            document.getElementById("thomas-dialog").style.display = "none";
        }
    }, {
        key: "debug",
        value: function debug() {
            var _this2 = this;

            this._push_pipeline(function () {
                console.log(_this2.games_object.toString());
                _this2._run_pipeline();
            });
            return this;
        }
    }, {
        key: "getComparison",
        value: function getComparison() {
            // NOT async
            var fc = this.games_object.getFlickchartMatchup();
            if (!fc.isNull) {
                return fc;
            } else {
                console.warn("Thomas: Cannot generate comparison.");
            }
        }
    }, {
        key: "promptComparison",
        value: function promptComparison() {
            var _this3 = this;

            this._push_pipeline(function () {
                var comp = _this3.getComparison();
                if (comp !== undefined && comp.game1 !== undefined && comp.game2 !== undefined) {
                    _this3.promptUser("Which game do you prefer?", [{
                        text: comp.game1.name,
                        click: function click() {
                            _this3.setComparison(comp, 1);
                            _this3._run_pipeline();
                        }
                    }, {
                        text: comp.game2.name,
                        click: function click() {
                            _this3.setComparison(comp, 2);
                            _this3._run_pipeline();
                        }
                    }]);
                } else {
                    _this3._run_pipeline();
                }
            });
            return this;
        }

        // Prompt the user with a message and present multiple options.
        // Message: the message to prompt the user
        // Buttons: an array of object of the form { text: "link text", click: function() { /* action */ } }

    }, {
        key: "promptUser",
        value: function promptUser(message, buttons) {
            if (document.getElementById("thomas-dialog") != null) {
                var el = document.getElementById("thomas-dialog");
                el.parentNode.removeChild(el);
            }
            var appendHtml = function appendHtml(el, str) {
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

            appendHtml(document.body, '<div id="thomas-dialog">' + '    <div id="thomas-dialog-content">' + '        <p>' + message + '</p>' + '        <div>' + buttonsHtml + '</div>' + '    </div>' + '</div>');

            // Add events to buttons after adding them to the DOM
            for (var i = 0; i < buttons.length; i++) {
                document.getElementById(buttons[i].buttonId).addEventListener("click", buttons[i].click);
            }
        }
    }, {
        key: "setComparison",
        value: function setComparison(comparison, selection) {
            // NOT async
            if (selection == 1 || selection == 2) {
                comparison.winnerIndex = selection;
                this.games_object.setFlickchartMatchup(comparison);
            } else {
                console.warn("Thomas: Selection must be either 1 or 2.");
            }
            return this;
        }
    }]);

    return Thomas;
})();

/**************************************************************
    METHODS
**************************************************************/

var getGames = function getGames() {
    // todo: get user input

    var games = [];
    var i, j;

    for (i = 1, j = 10; i <= 10; i++, j--) {
        games.push(new Game(i, j));
    }

    return games;
};

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
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**************************************************************
    CLASSES
**************************************************************/
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
        key: 'differential',
        value: function differential() {
            return this.wins - this.losses;
        }
    }, {
        key: 'toString',
        value: function toString() {
            return this.name;
        }
    }]);

    return Game;
})();

/**
 * Static helper methods for Games.
 * @class
 */

var GamesHelpers = (function () {
    function GamesHelpers() {
        _classCallCheck(this, GamesHelpers);
    }

    _createClass(GamesHelpers, null, [{
        key: 'compareGames',

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
        key: 'getUnlockedGames',
        value: function getUnlockedGames(games) {
            return _.filter(games, function (game) {
                return !game.locked;
            });
        }
    }, {
        key: 'lockAll',
        value: function lockAll(games) {
            return _.each(games, function (element, index, list) {
                return GamesHelpers.lockGame(list, index);
            });
        }
    }, {
        key: 'lockCompletelySortedGames',
        value: function lockCompletelySortedGames(games, matchups) {
            for (var i = 0; i < games.length; i++) {
                var gamesRankedLowerCount = matchups.getAllRankedLower(games[i].id).length;
                var gamesUnlockedExcludingCurrentGameCount = GamesHelpers.getUnlockedGames(games).length - 1;

                if (!games[i].locked && gamesRankedLowerCount == gamesUnlockedExcludingCurrentGameCount) {
                    games = GamesHelpers.lockGame(games, i);
                } else {
                    break;
                }
            }

            for (var i = games.length - 1; i >= 0; i--) {
                var gamesRankedHigherCount = matchups.getAllRankedHigher(games[i].id).length;
                var gamesUnlockedExcludingCurrentGameCount = GamesHelpers.getUnlockedGames(games).length - 1;

                if (!games[i].locked && gamesRankedHigherCount == gamesUnlockedExcludingCurrentGameCount) {
                    games = GamesHelpers.lockGame(games, i);
                } else {
                    break;
                }
            }

            return games;
        }
    }, {
        key: 'lockGame',
        value: function lockGame(games, index) {
            var gameToLock = games[index];
            gameToLock.locked = true;
            games[index] = gameToLock;
            return games;
        }
    }, {
        key: 'logMatchup',
        value: function logMatchup(matchups, winner, loser) {
            var match = new Matchup(winner, loser);

            matchups.add(match);

            return matchups;
        }
    }, {
        key: 'rankGames',
        value: function rankGames(list, game_matchups, gameIndex1, gameIndex2, isFirstBetter) {
            if (isFirstBetter) {
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

            return { list: list, game_matchups: game_matchups };
        }
    }, {
        key: 'reposition',
        value: function reposition(games, winnerIndex, loserIndex) {
            var winnerPosition = games[winnerIndex].position;
            var loserPosition = games[loserIndex].position;

            // if winner is positioned above loser
            if (winnerPosition < loserPosition) {
                var winner = games[winnerIndex];
                var loser = games[loserIndex];
                var gamesRankedAboveWinner = getAllRankedHigher(winner.id);
                var gamesRankedBelowLoser = getAllRankedLower(loser.id);

                if (winner.differential() > 0) {
                    var newPosition = winner.position - winner.differential();

                    for (var i = winnerPosition - 1; i >= newPosition; i--) {
                        if (games[i].locked || _.contains(gamesRankedAboveWinner, games[i].id)) {
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

                    for (var i = loserPosition + 1; i <= newPosition; i++) {
                        if (games[i].locked || _.contains(gamesRankedBelowLoser, games[i].id)) {
                            newPosition = i - 1;
                            break;
                        } else {
                            games[i].position -= 1;
                        }
                    }

                    games[loserIndex].position = newPosition;
                }
            } else {
                _.map(games, function (item) {
                    if (item.position >= loserPosition && item.position < winnerPosition) item.position += 1;
                });

                games[winnerIndex].position = loserPosition;
            }

            return games;
        }
    }, {
        key: 'unlockAll',
        value: function unlockAll(games) {
            for (var i = 0; i < games.length; i++) {
                games[i].locked = false;
                games[i].rankedThisIteration = false;
            }
            return games;
        }
    }, {
        key: 'unlockGame',
        value: function unlockGame(games, index) {
            var gameToLock = games[index];
            gameToLock.locked = false;
            games[index] = gameToLock;
            return games;
        }
    }]);

    return GamesHelpers;
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
        this.game_matchups = new matchups();
    }

    _createClass(Games, [{
        key: 'doesMatchupRemain',
        value: function doesMatchupRemain() {
            return _.filter(this.list, function (game) {
                return !game.rankedThisIteration && !game.locked;
            }).length >= 2;
        }
    }, {
        key: 'getFlickchartMatchup',
        value: function getFlickchartMatchup() {
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
                    var game1Index = _.indexOf(this.list, game1);
                    var game2 = this.getOpponent(this.list, game1, this.game_matchups);
                    var game2Index = _.indexOf(this.list, game2);

                    return new battle(game1, game2, game1Index, game2Index);
                }
            }

            return new battle();
        }
    }, {
        key: 'setFlickchartMatchup',
        value: function setFlickchartMatchup(battleResult) {
            var _GamesHelpers$rankGam = GamesHelpers.rankGames(this.list, this.game_matchups, battleResult.game1Index, battleResult.game2Index, battleResult.winnerIndex);

            var list = _GamesHelpers$rankGam.list;
            var game_matchups = _GamesHelpers$rankGam.game_matchups;

            this.list = list;
            this.game_matchups = game_matchups;
            this.sortList();

            console.log(this.game_matchups.toString());
        }
    }, {
        key: 'getFirstNotLockedOrRanked',
        value: function getFirstNotLockedOrRanked() {
            return _.find(this.list, function (game) {
                return !game.locked && !game.rankedThisIteration;
            });
        }
    }, {
        key: 'getOpponent',
        value: function getOpponent(games, game1, matchups) {
            var game2 = _.find(games, function (game) {
                return !game.locked && !game.rankedThisIteration && game.id !== game1.id && !matchups.isRanked(game1.id, game.id);
            });

            if (game2 === undefined) {
                game2 = _.find(games, function (game) {
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
        key: 'quickSort',
        value: function quickSort() {}
    }, {
        key: 'sortList',
        value: function sortList() {
            this.list.sort(GamesHelpers.compareGames);
        }
    }, {
        key: 'addGame',
        value: function addGame(game) {
            this.list.push(game);
        }

        /**
        * ToString for games.
        * @method
        */

    }, {
        key: 'toString',
        value: function toString() {
            return this.list.toString();
        }
    }]);

    return Games;
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
        key: 'toString',
        value: function toString() {
            return this.winner + '>' + this.loser;
        }
    }]);

    return Matchup;
})();

/**
 * A request for the user to pick which of two games he prefers.
 * @class
 * @param {string} game1 - The first game.
 * @param {string} game2 - The second game.
 * @param {string} game1Index - The index of the first game.
 * @param {string} game2Index - The index of the second game.
 * @param {string} winner - The index of the winner of the matchup.
 */

var battle = function battle(game1, game2, game1Index, game2Index, winner) {
    this.game1 = game1;
    this.game2 = game2;
    this.game1Index = game1Index;
    this.game2Index = game2Index;
    this.winnerIndex = winner;
    this.isNull = typeof game1 == 'undefined';
};

/**
 * A collection of matchups.
 * @class
 */
var matchups = function matchups() {
    this.list = [];

    this.add = function (matchup) {
        this.list.push(matchup);
    };

    //todo: pass in list as parameter
    this.getAllRankedLower = function (id, includeId) {
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

            losers = losers.concat(_.flatten(children));

            if (includeId) losers.push(id);

            return _.uniq(losers);
        }
    };

    //todo: pass in list as parameter
    this.getAllRankedHigher = function (id, includeId) {
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

            winners = winners.concat(_.flatten(parents));

            if (includeId) winners.push(id);

            return _.uniq(winners);
        }
    };

    this.isRanked = function (gameId1, gameId2) {
        var self = this;

        var higher = self.getAllRankedHigher(gameId1);
        var lower = self.getAllRankedLower(gameId1);
        var all = higher.concat(lower);

        return _.contains(all, gameId2);
    };
};
/**
 * ToString for matchups.
 * @method
 */
matchups.prototype.toString = function () {
    return this.list.toString();
};

var thomas = function thomas() {

    // Private
    var games_object;
    var process_pipeline = new Array();
    var process_running = false;

    var push_pipeline = function push_pipeline(action) {
        process_pipeline.push(action);
        if (!process_running) {
            process_running = true;
            run_pipeline();
        }
    };

    var run_pipeline = function run_pipeline() {
        if (process_pipeline.length) {
            // Dequeue and execute
            process_pipeline.shift()();
        } else {
            process_running = false;
        }
    };

    // Public
    var public_methods = {
        init: function init() {
            games_object = new Games([]);
            return this;
        },
        debug: function debug() {
            push_pipeline(function () {
                console.log(games_object.toString());
                run_pipeline();
            });
            return this;
        },
        addGame: function addGame(game_name) {
            push_pipeline(function () {
                games_object.addGame(new Game(games_object.list.length, -1, game_name));
                run_pipeline();
            });
            return this;
        },
        getComparison: function getComparison() {
            // NOT async
            var fc = games_object.getFlickchartMatchup();
            if (!fc.isNull) {
                return fc;
            } else {
                console.warn("Thomas: Cannot generate comparison.");
            }
        },
        setComparison: function setComparison(comparison, selection) {
            // NOT async
            if (selection == 1 || selection == 2) {
                comparison.winnerIndex = selection;
                games_object.setFlickchartMatchup(comparison);
            } else {
                console.warn("Thomas: Selection must be either 1 or 2.");
            }
            return this;
        },
        promptComparison: function promptComparison() {
            push_pipeline(function () {
                var comp = public_methods.getComparison();
                if (typeof comp !== 'undefined' && typeof comp.game1 !== 'undefined' && typeof comp.game2 !== 'undefined') {
                    promptUser("Which game do you prefer?", [{
                        text: comp.game1.name,
                        click: function click() {
                            public_methods.setComparison(comp, 1);
                            run_pipeline();
                        }
                    }, {
                        text: comp.game2.name,
                        click: function click() {
                            public_methods.setComparison(comp, 2);
                            run_pipeline();
                        }
                    }]);
                } else {
                    run_pipeline();
                }
            });
            return this;
        }
    };

    return public_methods.init();
};

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

var closePrompt = function closePrompt() {
    document.getElementById("thomas-dialog").style.display = "none";
};

// Promp the user with a message and present multiple options.
// Message: the message to promt the user
// Buttons: an array of object of the form { text: "link text", click: function() { /* action */ } }
var promptUser = function promptUser(message, buttons) {
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
        buttonsHtml += '<a id="' + buttons[i].buttonId + '" onclick="closePrompt()" href="javascript: void(0)">' + buttons[i].text + '</a>';
    }

    appendHtml(document.body, '<div id="thomas-dialog">' + '    <div id="thomas-dialog-content">' + '        <p>' + message + '</p>' + '        <div>' + buttonsHtml + '</div>' + '    </div>' + '</div>');

    // Add events to buttons after adding them to the DOM
    for (var i = 0; i < buttons.length; i++) {
        document.getElementById(buttons[i].buttonId).addEventListener("click", buttons[i].click);
    }
};

/**************************************************************
    TEMP MAIN
**************************************************************/
var test = new thomas();

test.addGame('llama').addGame('sushi').addGame('taco').addGame('chocolate');
test.debug();

test.promptComparison();
test.promptComparison();
test.promptComparison();
test.promptComparison();
test.promptComparison();
test.promptComparison();

test.debug();
const fs = require('fs');

const FILENAME = "data/prize-tier.json";

const HIGHEST_RANK = 6;

const HIGHEST_SUBRANK = 3;

/**
 * Represents a possible dice combination requirement for a prize tier.
 */
class RollCombination {

  constructor(tier, roll) {
    this.tier = tier;
    this.roll = roll;
  }

}

/**
 * Represents a prize tier that a dice roll can fall under and the dice
 * combinations requirements.
 */
class PrizeTier {

  constructor(name, rank, subrank, desc, combinations) {
    this.name = name;
    this.rank = rank;
    this.subrank = subrank;
    this.desc = desc;
    this.combinations = combinations;
  }

}

/**
 * Internal class that represents the results of a user's dice roll. 
 */
class DiceRoll {

  constructor(roll, prizeTier, combinationTier) {
    this.roll = roll;
    this.prizeTier = prizeTier;
    this.combination = combinationTier;
  }

}

const createPrizeTiers = (() => {
  let jsonFile = fs.readFileSync(FILENAME);
  let tier = JSON.parse(jsonFile);

  return tier.map(t => {
    var name = t.name;
    var rank = t.rank;
    var subrank = t.subrank || 0;
    var desc = t.desc;
    var combinations = t.combination.map(c => {
      var tier = c.tier || 0;
      var roll = c.roll;

      return new RollCombination(tier, roll);
    });

    return new PrizeTier(name, rank, subrank, desc, combinations);
  });

});

const PRIZE_TIERS = createPrizeTiers();

const PRIZE_TIER_CACHE = [...Array(HIGHEST_RANK + 1)].map(e => Array(HIGHEST_SUBRANK + 1));

const ComparisonResult = Object.freeze({
  LESS_THAN: -1,
  EQUAL: 0,
  GREATER_THAN: 1
});

/**
 * Evaluates the dice roll if it falls under the dice combination.
 *
 * @param {Array} roll        a 6-number array representing each dice result.
 * @param {Array} combination a 6-string array representing each dice result. Valid characters 
 *                              are numbers 1 - 6, "*" for wildcard, and "x" & "y" for matching numbers.
 * @returns {Boolean} true if the roll falls under the combination, false otherwise.
 */
function __doesRollMatchCombination(roll, combination) {
  // combination is expecting [1-6]s then [x]s then [y]s then [*]s.

  if (roll === null) {
      return false
  }

  var rollBucket = [0, 0, 0, 0, 0, 0, 0];
  roll.forEach(item => rollBucket[item]++);

  var xToMatch = 0;
  var yToMatch = 0;

  // clear out defined numbers first
  for (var i = 0; i < combination.length; i++) {
    var match = combination[i];

    if (!isNaN(match)) {
      if (--rollBucket[parseInt(match)] < 0) {
        return false;
      }
    } else if (match == "x") {
      xToMatch++;
    } else if (match == "y") {
      yToMatch++;
    }
  }

  if (xToMatch == 0 && yToMatch == 0) {
    return true;
  } else if (xToMatch == 0 && yToMatch > 0) {
    // to simplify, just pass "y"s to "x"s
    xToMatch = yToMatch;
    yToMatch = 0;
  }

  for (var i = 1; i < rollBucket.length; i++) {
    if (yToMatch > 0) {
      for (var j = i+1; j < rollBucket.length; j++) {
        if ((rollBucket[i] >= xToMatch && rollBucket[j] >= yToMatch) ||
            (rollBucket[i] >= yToMatch && rollBucket[j] >= xToMatch)) {
          return true;
        }
      }
    } else if (rollBucket[i] >= xToMatch) {
      return true;
    }
  }

  return false;
}

/**
 * Evaluates the dice roll and returns the prize tier that it falls in.
 *
 * @param {Array} roll a 6-number array representing each dice result.
 * @returns {DiceRoll} the prize tier, or null if it does not fall under any.
 */
function __evaluateRoll(roll) {
  for (var i = 0; i < PRIZE_TIERS.length; i++) {
    var prizeTier = PRIZE_TIERS[i];
    
    for (var j = 0; j < prizeTier.combinations.length; j++) {
      var rollCombination = prizeTier.combinations[j];
      
      if (__doesRollMatchCombination(roll, rollCombination.roll)) {
        var combinationTier = rollCombination.tier || 0;
        return new DiceRoll(roll, prizeTier, combinationTier);
      }
    }
  }

  return null;
}

function __checkNullBeforeComparing(a, b) {
  if (a == null) {
    if (b == null) {
      return ComparisonResult.EQUAL;
    }
    return ComparisonResult.LESS_THAN;
  } else if (b == null) {
    return ComparisonResult.GREATER_THAN;
  } else {
    return null;
  }
}

/**
 * Utility function to compare two ranks (also works for subranks).
 * 
 * @param {Number} rankA a numbered rank.
 * @param {Number} rankB a numbered rank.
 * @returns {Number} 1 if the first rank is greater than the second rank, 0 if equal, or -1 otherwise.
 */
function __compareRanks(rankA, rankB) {
  var check = __checkNullBeforeComparing(rankA, rankB);
  if (check != null) return check;

  if (rankA == rankB)
    return ComparisonResult.EQUAL;
  else
    return rankA > rankB ? ComparisonResult.GREATER_THAN : ComparisonResult.LESS_THAN;
}

/**
 * Compares two roll evaluation results against each other.
 *
 * @param {Object} a 6-array dice roll.
 * @param {Object} b 6-array dice roll.
 * @returns {Number} 1 if `a` is greater than `b`. -1 if `b` is greater than `a`. If they are tied, 0 is returned instead.
 */
function compareEvals(a, b) {
  var resultA = __evaluateRoll(a);
  var resultB = __evaluateRoll(b);

  var check = __checkNullBeforeComparing(resultA, resultB);
  if (check != null) return check;

  var rankA = { rank: resultA.prizeTier.rank, subrank: resultA.prizeTier.subrank };
  var rankB = { rank: resultB.prizeTier.rank, subrank: resultB.prizeTier.subrank };

  if (rankA.rank != rankB.rank)
    return __compareRanks(rankA.rank, rankB.rank);
  else if (rankA.subrank != rankB.subrank) 
    return __compareRanks(rankA.subrank, rankB.subrank);
  else
    return ComparisonResult.EQUAL;
}

/**
 * Returns the label of a roll evaluation result.
 * @param {Object} eval The evaluation to be converted into string form.
 */
function getEvalLabel(eval) {
  if (eval == null) return "";

  var cachedLabel = PRIZE_TIER_CACHE[eval.rank][eval.subrank];
  if (cachedLabel != null) {
    return cachedLabel;
  }

  for (var i = 0; i < PRIZE_TIERS.length; i++) {
    var prizeTier = PRIZE_TIERS[i];
    
    if (prizeTier.rank == eval.rank) {
      if (prizeTier.subrank == eval.subrank) {
        PRIZE_TIER_CACHE[prizeTier.rank][prizeTier.subrank] = prizeTier.name;
        return prizeTier.name;
      }
    }
  }

  return "";
}

/**
 * Evaluates a roll to determine what rank they fall under.
 *
 * @param {Array} roll A 6-member array where each member's value can only range between 1 to 6, inclusive.
 * @returns {Object} Contains `rank` and `subrank` properties. `subrank` is optional, though. If the roll has no
 *  rank, just return `null`.
 */
function evaluate(roll) {
  var result = __evaluateRoll(roll);
  if (result == null) return null;

  return {
    rank: result.prizeTier.rank,
    subrank: result.prizeTier.subrank
  }
}

/**
 * Returns the different ranks and their labels.
 * @returns {Array}
 */
function getRankList() {
  var rankList = [];

  for (var i = 0; i < PRIZE_TIERS.length; i++) {
    var prizeTier = PRIZE_TIERS[i];

    rankList.push({
      rank: prizeTier.rank,
      subrank: prizeTier.subrank,
      label: prizeTier.name
    });
  }

  return rankList;
}

module.exports = () => {
  return {
    compareEvals,
    getEvalLabel,
    evaluate,
    getRankList,
  }
}

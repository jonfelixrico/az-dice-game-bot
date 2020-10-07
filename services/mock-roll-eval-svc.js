const fs = require('fs');

const FILENAME = "data/prize-tier.json";

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

/**
 * Evaluates the dice roll if it falls under the dice combination.
 *
 * @param {Array} roll        a 6-number array representing each dice result.
 * @param {Array} combination a 6-string array representing each dice result. Valid characters 
 *                              are numbers 1 - 6, "*" for wildcard, and "x" & "y" for matching numbers.
 * @returns true if the roll falls under the combination, false otherwise.
 */
function __doesRollMeetRequirement(roll, combination) {
  if (roll === null) {
      return false
  }
  // Sort the roll dice and combinations first
  var rollString = roll.sort().join("");
  var combinationString = combination.sort().join("");
  var uniqueValues = roll.filter((item, i, ar) => ar.indexOf(item) === i);

  combinationString = combinationString.replace(/x/g, uniqueValues[0]);
  if (uniqueValues.length >= 2) {
    combinationString = combinationString.replace(/y/g, uniqueValues[1]);
  }
  combinationString = combinationString.replace(/\*/g, "");

  if (rollString.includes(combinationString)) {
    return true;
  }

  return false;
}

/**
 * Evaluates the dice roll and returns the prize tier that it falls in.
 *
 * @param {Array} roll a 6-number array representing each dice result.
 * @returns the prize tier or null if it does not fall under any.
 */
function __evaluateRoll(roll) {
  for (var i = 0; i < PRIZE_TIERS.length; i++) {
    var prizeTier = PRIZE_TIERS[i];
    
    for (var j = 0; j < prizeTier.combinations.length; j++) {
      var rollCombination = prizeTier.combinations[j];
      
      if (__doesRollMeetRequirement(roll, rollCombination.roll)) {
        var combinationTier = rollCombination.tier || 0;
        return new DiceRoll(roll, prizeTier, combinationTier);
      }
    }
  }

  return null;
}

/**
 * Compares the special case of evaluating a Chiong Guan subrank 1 roll.
 * This compares the sum of the two wildcard numbers.
 *
 * @param {Array} rollA a 6-number array representing each dice result.
 * @param {Array} rollB a 6-number array representing each dice result.
 * @returns the prize tier or null if it does not fall under any.
 */
function __compareChiongGuan(rollA, rollB) {
  var rollAF = rollA.sort().filter((item, i) => item === 4);
  var rollBF = rollB.sort().filter((item, i) => item === 4);

  var sumReducer = (a, b) => a + b;
  var sumA = rollAF.reduce(sumReducer);
  var sumB = rollBF.reduce(sumReducer);

  return sumA > sumB ? 1 : -1;
}

/**
 * Compares the price tiers of two dice roll results.
 * 
 * @param {Array} rollA a DiceRoll object representing the roll.
 * @param {Array} rollB a DiceRoll object representing the roll.
 * @returns {Number} -1 if rollA is lesser than rollB, 0 if equal, and 1 otherwise.
 */
function __doCompareRolls(rollA, rollB) {
  if (rollA == null) {
    if (rollB == null) {
      return 0;
    }

    return -1;
  } else if (rollB == null) {
    return 1;
  }

  if (rollA.prizeTier.rank != rollB.prizeTier.rank) {
    return rollA.prizeTier.rank > rollB.prizeTier.rank ? 1 : -1;
  }

  if (rollA.prizeTier.subrank != rollB.prizeTier.subrank) {
    return rollA.prizeTier.subrank > rollB.prizeTier.subrank ? 1 : -1;
  }

  if (rollA.combinationTier != rollB.combinationTier) {
    return rollA.combinationTier > rollB.combinationTier ? 1 : -1;
  }

  if (rollA.prizeTier.rank == 6 && rollA.prizeTier.subrank == 1) {
    return __compareChiongGuan(rollA.roll, rollB.roll);
  }

  return 0;
}

/**
 * Returns the prize tier name of a dice roll.
 *
 * @param {Array} roll a 6-number array representing each dice result.
 * @returns {String} The chinese name of the roll combination. Null if it's a no-prize roll.
 */
function getRollLabel(roll) {
  var rollDice = __evaluateRoll(roll);
  if (rollDice == null) {
    return null;
  }

  return rollDice.prizeTier.name;
}

/**
 * Compares two dice rolls.
 * 
 * @param {Array} rollA a 6-number array representing each dice result.
 * @param {Array} rollA a 6-number array representing each dice result.
 * @returns {String} The chinese name of the roll combination. Null if it's a no-prize roll.
 */
function compareRolls(rollA, rollB) {
  var resultA = __evaluateRoll(rollA);
  var resultB = __evaluateRoll(rollB);
  return __doCompareRolls(resultA.prizeTier, resultB.prizeTier);
}

module.exports = () => {
  return {
    getRollLabel,
    compareRolls
  }
}
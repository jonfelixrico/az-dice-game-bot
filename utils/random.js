  /**
   * Generates a random integer between the min and the max values.
   * The result is inclusive of the min & max values
   * 
   * @param {Integer} min Lower bound
   * @param {Integer} max Upper bound
   */
  function randomIntRange(min, max) {
    return min + Math.floor((max - min + 1) * Math.random());
  }
  
  /**
   * Generates a random integer.
   */
  function randomInt() {
    return Math.floor(Math.random());
  }

  module.exports = {
    randomIntRange,
    randomInt,
  }
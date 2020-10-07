// for the mocks only. cycles through the remarks.
let mockOnlyCtr = 0

/**
 *
 * @param {Number} rank
 * @param {Number} subRank
 */
function getRemarks(rank, subRank) {
  const mode = mockOnlyCtr++ % 2

  if (mode === 0) {
    return {
      isGif: true,
      content:
        'https://media1.tenor.com/images/29650410a6ed4f0117dc72159182e55d/tenor.gif?itemid=14871471',
    }
  }

  return {
    isGif: false,
    content: 'RANDOM_QUOTE_HERE',
  }
}

module.exports = () => {
  return {
    getRemarks,
  }
}

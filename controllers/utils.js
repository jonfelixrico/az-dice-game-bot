const DICE_FACE_EMOJI_ARR = [
  '<:done:768806750307876914>',
  '<:dtwo:768805382738542624>',
  '<:dthree:768805383535198270>',
  '<:dfour:768806352638050356>',
  '<:dfive:768805382834618370>',
  '<:dsix:768805383674265610>',
]

function diceRollToString(rolled) {
  return rolled.map((face) => DICE_FACE_EMOJI_ARR[face - 1]).join(' ')
}

module.exports = {
  diceRollToString,
}

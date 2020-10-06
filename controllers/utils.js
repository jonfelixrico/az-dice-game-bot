const DICE_FACE_EMOJI_ARR = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣']

function diceRollToString(rolled) {
  return rolled.map((face) => DICE_FACE_EMOJI_ARR[face - 1]).join(' ')
}

module.exports = {
  diceRollToString,
}

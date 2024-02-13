export const HIDDEN_POWER_TYPES = [
  "Fighting",
  "Flying",
  "Poison",
  "Ground",
  "Rock",
  "Bug",
  "Ghost",
  "Steel",
  "Fire",
  "Water",
  "Grass",
  "Electric",
  "Psychic",
  "Ice",
  "Dragon",
  "Dark",
];

export class PokemonIvs {
  attack = 0;
  defense = 0;
  special = 0;
  speed = 0;
}

/**
 * Generate a nibble from each IV's respective bit
 * @param {PokemonIvs} ivs - Pokemon IVs
 * @param {number} bit - The bit to take
*/
export function generateNibbleFromIVs(ivs, bit) {
  const specialBit = (ivs.special >> bit) & 1;
  const speedBit = (ivs.speed >> bit) & 1;
  const defenseBit = (ivs.defense >> bit) & 1;
  const attackBit = (ivs.attack >> bit) & 1;

  return specialBit | (speedBit << 1) | (defenseBit << 2) | (attackBit << 3);
}

/**
 * Calculate the HP IV
 * @param {PokemonIvs} ivs - Pokemon IVs
*/
export function hpIv(ivs) {
  return generateNibbleFromIVs(ivs, 0);
}

/**
 * Calculate hidden power's type from IVs
 * @param {PokemonIvs} ivs - Pokemon IVs
*/
export function hidden_powerType(ivs) {
  const lookupIndex = ((ivs.attack & 0x3) << 2) | (ivs.defense & 0x3); // 0-15
  return HIDDEN_POWER_TYPES[lookupIndex];
}

/**
 * Calculate hidden power's base power from IVs
 * @param {PokemonIvs} ivs - Pokemon IVs
*/
export function hidden_powerPower(ivs) {
  const sum = generateNibbleFromIVs(ivs, 3);
  const specialRemainder = ivs.special & 0x3;

  return ((5 * sum + specialRemainder) >> 1) + 31;
}

/**
 * Calculate if a Pokemon is shiny from the IVs
 * @param {PokemonIvs} ivs - Pokemon IVs
*/
export function shiny(ivs) {
  return (
    ivs.defense == 10 &&
    ivs.special == 10 &&
    ivs.speed == 10 &&
    (ivs.attack & 2) != 0
  );
}
export const HIDDEN_POWER_TYPES: string[] = [
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
  attack: number = 0;
  defense: number = 0;
  special: number = 0;
  speed: number = 0;
}

/** Generate a nibble from each IV's respective bit */
export function generateNibbleFromIVs(ivs: PokemonIvs, bit: number) {
  const specialBit = (ivs.special >> bit) & 1;
  const speedBit = (ivs.speed >> bit) & 1;
  const defenseBit = (ivs.defense >> bit) & 1;
  const attackBit = (ivs.attack >> bit) & 1;

  return specialBit | (speedBit << 1) | (defenseBit << 2) | (attackBit << 3);
}

/** Calculate the HP IV */
export function hpIv(ivs: PokemonIvs) {
  return generateNibbleFromIVs(ivs, 0);
}

/** Calculate hidden power's type from IVs */
export function hidden_powerType(ivs: PokemonIvs) {
  const lookupIndex = ((ivs.attack & 0x3) << 2) | (ivs.defense & 0x3); // 0-15
  return HIDDEN_POWER_TYPES[lookupIndex];
}

/** Calculate hidden power's base power from IVs */
export function hidden_powerPower(ivs: PokemonIvs) {
  const sum = generateNibbleFromIVs(ivs, 3);
  const specialRemainder = ivs.special & 0x3;

  return ((5 * sum + specialRemainder) >> 1) + 31;
}

/** Calculate if a Pokemon is shiny from the IVs */
export function shiny(ivs: PokemonIvs) {
  return (
    ivs.defense == 10 &&
    ivs.special == 10 &&
    ivs.speed == 10 &&
    (ivs.attack & 2) != 0
  );
}
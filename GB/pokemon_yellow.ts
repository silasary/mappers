import { getValue, setValue } from "../common";
import { hpIv } from "../common/pokemon";

const PARTY_SIZE = 6;

export function postprocessor() {
  // FSM FOR GAMESTATE TRACKING
  // MAIN GAMESTATE: This tracks the three basic states the game can be in.
  // 1. "No Pokemon": cartridge reset; player has not received a Pokemon
  // 2. "Overworld": Pokemon in party, but not in battle
  // 3. "Battle": In battle

  if (getValue<number>('player.team.0.level') === 0) {
      setValue('meta.state', 'No Pokemon')
  }
  else if (getValue<string>("battle.mode") === null) {
      setValue('meta.state', 'Overworld')
  }
  else if (getValue<number>("battle.other.battleStart") == 0) {
      setValue('meta.state', 'To Battle')
  }
  else if (getValue<string>("battle.lowHealthAlarm") === "Disabled") {
      setValue('meta.state', 'From Battle')
  }
  else {
      setValue('meta.state', 'Battle')
  }

  for (let index = 0; index < PARTY_SIZE; index++) {
    const ivs = {
      attack: getValue<number>(`player.team.${index}.ivs.attack`),
      defense: getValue<number>(`player.team.${index}.ivs.defense`),
      special: getValue<number>(`player.team.${index}.ivs.special`),
      speed: getValue<number>(`player.team.${index}.ivs.speed`),
    };

    setValue(`player.team.${index}.ivs.hp`, hpIv(ivs));
  }
}

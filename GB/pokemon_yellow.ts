import { getValue, setValue } from "../common";
import { hpIv } from "../common/pokemon";

const PARTY_SIZE = 6;

export function getMetaState(): string {
  // FSM FOR GAMESTATE TRACKING
  // MAIN GAMESTATE: This tracks the three basic states the game can be in.
  // 1. "No Pokemon": cartridge reset; player has not received a Pokemon
  // 2. "Overworld": Pokemon in party, but not in battle
  // 3. "To Battle": Battle has started but player hasn't sent their Pokemon in yet
  // 4. "From Battle": Battle result has been decided but the battle has not transition to the overworld yet
  // 5. "Battle": In battle
  const team_0_level: number = getValue('player.team.0.level')
  const outcome_flags: number = getValue('battle.other.outcome_flags')
  const battle_start: number = getValue('battle.other.battle_start')
  const battle_mode: string = getValue('battle.mode')
  const low_health_alarm: string = getValue('battle.other.low_health_alarm')
  if (team_0_level == 0) {
    return 'No Pokemon'
  }
  else if (battle_mode == null) {
    return 'Overworld'
  }	
  else if (battle_start == 0) {
    return 'To Battle'
  }	
  else if (low_health_alarm == "Disabled" || outcome_flags > 0) {
    return 'From Battle'
  }
  else {
    return 'Battle'
  }
}

export function getBattleOutcome(): string | null {
  const outcome_flags: number = getValue('battle.other.outcome_flags')
  const state: string = getMetaState()
  switch (state) {
    case 'From Battle':
      switch (outcome_flags) {
        case 0:
          return 'Win'
        case 1:
          return 'Lose'
        case 2:
          return 'Flee'
        default:
          return null
      }
  }
  return null
}

export function postprocessor() {
  setValue('meta.state', getMetaState())
  setValue('battle.outcome', getBattleOutcome())

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

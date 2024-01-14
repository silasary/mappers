import { getValue, setValue } from "../common";
import {
  hidden_powerPower,
  hidden_powerType,
  hpIv,
  shiny
} from "../common/pokemon";

const PARTY_SIZE: number = 6;

export function getMetaState(): string {
  const team_0_level: number = getValue('player.team.0.level')
  const outcome_flags: number = getValue('battle.other.outcome_flags')
  const battle_mode: string = getValue('battle.mode')
  const low_health_alarm: string = getValue('battle.other.low_health_alarm')
  const team_0_species: string = getValue('player.team.0.species')
  const player_battle_species: string = getValue('battle.player.active_pokemon.species')
  const state: string = getValue('meta.state')
  if (team_0_level == 0) {
    return 'No Pokemon'
  }
  else if (battle_mode == null) {
    return 'Overworld'
  }	
  else if (low_health_alarm == "Disabled" || outcome_flags > 0) {
    return 'From Battle'
  }
  else if (team_0_species == player_battle_species) {
    return 'Battle'
  }
  else if ((state == 'Overworld' || state == 'To Battle') && battle_mode != null) {
    return 'To Battle'
  }
  else {
    return 'Battle'
  }
}

export function getEncounterRate(): number {
  const time_of_day: string = getValue("time.current.time_of_day");
  const morning: number = getValue("overworld.encounter_rates.morning");
  const day: number = getValue("overworld.encounter_rates.day");
  const night: number = getValue("overworld.encounter_rates.night");
  switch (time_of_day) {
    case "Morning":
      return morning;
    case "Day":
      return day;
    case "Night":
      return night;
    default:
      return 0;
  }
}

export function getBattleOutcome(): string | null {
  const outcome_flags: number = getValue('battle.other.outcome_flags')
  const state: string = getMetaState()
  switch (state) {
    case 'From Battle':
      switch (outcome_flags) {
        case 0:
        case 64:
        case 128:
        case 192:
          return 'Win'
        case 1:
        case 65:
        case 129:
        case 193:
          return 'Lose'
        case 2:
        case 66:
        case 130:
        case 194:
          return 'Flee'
        default:
          return null
      }
  }
  return null
}

export function postprocessor() {
  setValue("meta.state", getMetaState());
  setValue("overworld.encounter_rate", getEncounterRate());
  setValue("battle.outcome", getBattleOutcome());

  for (let index = 0; index < PARTY_SIZE; index++) {
    const ivs = {
      attack: getValue<number>(`player.team.${index}.ivs.attack`),
      defense: getValue<number>(`player.team.${index}.ivs.defense`),
      special: getValue<number>(`player.team.${index}.ivs.special`),
      speed: getValue<number>(`player.team.${index}.ivs.speed`),
    };

    setValue(`player.team.${index}.shiny`, shiny(ivs));
    setValue(`player.team.${index}.hidden_power.power`, hidden_powerPower(ivs));
    setValue(`player.team.${index}.hidden_power.type`, hidden_powerType(ivs));
    setValue(`player.team.${index}.ivs.hp`, hpIv(ivs));
  }
}

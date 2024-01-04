import { getValue, setValue } from "../common";
import {
  hiddenPowerPower,
  hiddenPowerType,
  hpIv,
  shiny
} from "../common/pokemon";

const PARTY_SIZE = 6;

export function getMetaState(): string {
  if (getValue('player.team.0.level') == 0) {
    return 'No Pokemon'
  }
  else if (getValue("battle.mode") == null) {
    return 'Overworld'
  }
  else if (getValue("battle.other.lowHealthAlarm") == "Disabled") {
    return 'From Battle'
  }
  else if (getValue('player.team.0.species') == getValue('battle.player.activePokemon.species')) {
    return 'Battle'
  }
  else if ((getValue('meta.state') == 'Overworld' || getValue('meta.state') == 'To Battle') && getValue("battle.mode") != null) {
    return 'To Battle'
  }
  else {
    return 'Battle'
  }
}

export function postprocessor() {
  setValue("meta.state", getMetaState());

  for (let index = 0; index < PARTY_SIZE; index++) {
    const ivs = {
      attack: getValue<number>(`player.team.${index}.ivs.attack`),
      defense: getValue<number>(`player.team.${index}.ivs.defense`),
      special: getValue<number>(`player.team.${index}.ivs.special`),
      speed: getValue<number>(`player.team.${index}.ivs.speed`),
    };

    setValue(`player.team.${index}.shiny`, shiny(ivs));
    setValue(`player.team.${index}.hiddenPower.power`, hiddenPowerPower(ivs));
    setValue(`player.team.${index}.hiddenPower.type`, hiddenPowerType(ivs));
    setValue(`player.team.${index}.ivs.hp`, hpIv(ivs));
  }
}

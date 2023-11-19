"use strict";

function getPropertyValue(path) {
    if (mapper.properties[path] === undefined) { throw new Error(`${path} is not defined in properties.`) }
    return mapper.properties[path].value
}

function setPropertyValue(path, value) {
    if (mapper.properties[path] === undefined) { throw new Error(`${path} is not defined in properties.`) }
    mapper.properties[path].value = value
}

function preprocessor() {
    // FSM FOR GAMESTATE TRACKING
    // MAIN GAMESTATE: This tracks the three basic states the game can be in.
    // 1. "No Pokemon": cartridge reset; player has not received a Pokemon
    // 2. "Overworld": Pokemon in party, but not in battle
    // 3. "Battle": In battle
    setPropertyValue('meta.state', 'No Pokemon')
    if (getPropertyValue('player.team.0.level') == 0) {
        setPropertyValue('meta.state', 'No Pokemon')
    }
    else if (getPropertyValue("battle.type") == "None") {
        setPropertyValue('meta.state', 'Overworld')
    }
    else if (getPropertyValue("battle.turnInfo.battleStart") == 0) {
        setPropertyValue('meta.state', 'To Battle')
    }
    else if (getPropertyValue("battle.lowHealthAlarm") == "Disabled") {
        setPropertyValue('meta.state', 'From Battle')
    }
    else {
        setPropertyValue('meta.state', 'Battle')
    }
}
// Pokemon RBY and GSC functions
//
// NOTE: Keep pokemon_crystal.js, pokemon_gold_silver.js, pokemon_red_blue.js, and pokemon_yellow.js in sync

const PARTY_SIZE = 6
const HIDDEN_POWER_TYPES = [
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
]

// Retrieve the property from the mapper
function getProperty(path) {
    const property = mapper.properties[path]
    if (!property) {
        throw new Error(`${path} is not defined in properties!`)
    }
    return property
}

// Convenience function for retrieving the property value
function getPropertyValue(path) {
    return getProperty(path).value
}

// Convenience function for setting the property value
function setPropertyValue(path, newValue) {
    getProperty(path).value = newValue
}

// Generate a nibble from each IV's respective bit
function generateNibbleFromIVs(ivs, bit) {
    const specialBit = (ivs.special >> bit) & 1
    const speedBit = (ivs.speed >> bit) & 1
    const defenseBit = (ivs.defense >> bit) & 1
    const attackBit = (ivs.attack >> bit) & 1
    
    return specialBit | (speedBit << 1) | (defenseBit << 2) | (attackBit << 3)
}

// Calculate the HP IV
function calculateHPIV(ivs) {
    return generateNibbleFromIVs(ivs, 0)
}

// Calculate hidden power's type from IVs
function calculateHiddenPowerType(ivs) {
    const lookupIndex = ((ivs.attack & 0x3) << 2) | (ivs.defense & 0x3) // 0-15
    return HIDDEN_POWER_TYPES[lookupIndex]
}

// Calculate hidden power's base power from IVs
function calculateHiddenPowerBasePower(ivs) {
    const sum = generateNibbleFromIVs(ivs, 3)
    const specialRemainder = ivs.special & 0x3
    
    return ((5 * sum + specialRemainder) >> 1) + 31
}

// Calculate if a Pokemon is shiny from the IVs
function isShiny(ivs) {
    return ivs.defense == 10 && ivs.special == 10 && ivs.speed == 10 && ((ivs.attack & 2) != 0)
}

function updatePropertiesForPartyPokemon(path) {
    const generation = Number(getPropertyValue("meta.generation"))
    
    const attack = Number(getPropertyValue(`${path}.ivs.attack`))
    const defense = Number(getPropertyValue(`${path}.ivs.defense`))
    const special = Number(getPropertyValue(`${path}.ivs.special`))
    const speed = Number(getPropertyValue(`${path}.ivs.speed`))
    
    const ivs = { attack, defense, special, speed }
    
    if (generation === 2) {
        setPropertyValue(`${path}.shiny`, isShiny(ivs))
        setPropertyValue(`${path}.hiddenPower.power`, calculateHiddenPowerBasePower(ivs))
        setPropertyValue(`${path}.hiddenPower.type`, calculateHiddenPowerType(ivs))
    }
    
    setPropertyValue(`${path}.ivs.hp`, calculateHPIV(ivs))
}

// Gen 1-2 uses IVs/DVs to calculate a lot of things, so we calculate this in the preprocessor
function preprocessor() {
    for (let i = 0; i < PARTY_SIZE; i++) {
        updatePropertiesForPartyPokemon(`player.team.${i}`)
    }

    // FSM FOR GAMESTATE TRACKING
    // MAIN GAMESTATE: This tracks the three basic states the game can be in.
    // 1. "No Pokemon": cartridge reset; player has not received a Pokemon
    // 2. "Overworld": Pokemon in party, but not in battle
    // 3. "Battle": In battle
    setPropertyValue('meta.state', 'No Pokemon')
    if (getPropertyValue('player.team.0.level') == 0) {
        setPropertyValue('meta.state', 'No Pokemon')
    }
    else if (getPropertyValue("battle.mode") == null) {
        setPropertyValue('meta.state', 'Overworld')
    }
    else if (getPropertyValue("battle.other.battleStart") == 0) {
        setPropertyValue('meta.state', 'To Battle')
    }
    else if (getPropertyValue("battle.lowHealthAlarm") == "Disabled") {
        setPropertyValue('meta.state', 'From Battle')
    }
    else {
        setPropertyValue('meta.state', 'Battle')
    }
}

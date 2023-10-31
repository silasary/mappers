function getPropertyValue(path) {
    if (mapper.properties[path] === undefined) { throw new Error(`${path} is not defined in properties.`) }
    return mapper.properties[path].value
}

function setPropertyValue(path, value) {
    if (mapper.properties[path] === undefined) { throw new Error(`${path} is not defined in properties.`) }
    mapper.properties[path].value = value
}

// prng function; used for decryption.
function prngNext(prngSeed) {
    // Ensure 32-bit unsigned result
    const newSeed = (0x41C64E6D * prngSeed + 0x6073) >>> 0;
    const value = (newSeed >>> 16) & 0xFFFF;

    return { newSeed, value }
}

function getBits(a, b, d) {
    return (a >> b) & ((1 << d) - 1);
}

// Block shuffling orders - used for Party structure encryption and decryption
// Once a Pokemon's data has been generated it is assigned a PID which determines the order of the blocks
// The Pokemon's PID never changes, therefore the order of the blocks remains fixed for that Pokemon
const shuffleOrders = {
    0: [0, 1, 2, 3],
    1: [0, 1, 3, 2],
    2: [0, 2, 1, 3],
    3: [0, 3, 1, 2],
    4: [0, 2, 3, 1],
    5: [0, 3, 2, 1],
    6: [1, 0, 2, 3],
    7: [1, 0, 3, 2],
    8: [2, 0, 1, 3],
    9: [3, 0, 1, 2],
    10: [2, 0, 3, 1],
    11: [3, 0, 2, 1],
    12: [1, 2, 0, 3],
    13: [1, 3, 0, 2],
    14: [2, 1, 0, 3],
    15: [3, 1, 0, 2],
    16: [2, 3, 0, 1],
    17: [3, 2, 0, 1],
    18: [1, 2, 3, 0],
    19: [1, 3, 2, 0],
    20: [2, 1, 3, 0],
    21: [3, 1, 2, 0],
    22: [2, 3, 1, 0],
    23: [3, 2, 1, 0]
};

// Preprocessor runs every loop (everytime gamehook updates)
function preprocessor() {
    // This is the same as the global_pointer, it is named "base_ptr" for consistency with the old C# code    
    const base_ptr = memory.defaultNamespace.get_uint32_le(0x2101D2C)
    if (base_ptr === 0) {
        // Ends logic is the base_ptr is 0, this is to prevent errors during reset and getting on a bike.

        variables.global_pointer = null
        return
    }

    variables.global_pointer = base_ptr // variable used for mapper addresses, it is the same as "base_ptr"

    const enemy_ptr = memory.defaultNamespace.get_uint32_le(base_ptr + 0x352F4) // Only needs to be calculated once per loop
    
    // FSM FOR GAMESTATE TRACKING
    // MAIN GAMESTATE: This tracks the three basic states the game can be in.
    // 1. "No Pokemon": cartridge reset; player has not received a Pokemon
    // 2. "Overworld": Pokemon in party, but not in battle
    // 3. "Battle": In battle
    setPropertyValue('meta.state', "No Pokemon")
    // State1: No Pokemon
    if (getPropertyValue("battle.player.teamCount") == 0) {
        setPropertyValue('meta.state', "No Pokemon")
        // State2: Battle
    } else if (getPropertyValue("battle.player.activePokemon.internals.personalityValue") == getPropertyValue("player.team.0.internals.personalityValue")) {
        setPropertyValue('meta.state', "Battle")
        // State3: Overworld
    } else if (getPropertyValue("battle.player.activePokemon.internals.personalityValue") != getPropertyValue("player.team.0.internals.personalityValue")) {
        setPropertyValue('meta.state', "Overworld")
    }

    // ENEMY POKEMON MID-BATTLE STATE: Allows for precise timing during battles
    if (!mapper.properties['meta.state'].value || getPropertyValue('meta.state') == "No Pokemon" || getPropertyValue('meta.state') == "Overworld") {
        setPropertyValue('meta.stateEnemy', "N/A")
    } else if (getPropertyValue('meta.state') == "Battle" && getPropertyValue("battle.outcome") == 1) {
        setPropertyValue('meta.stateEnemy', "Battle Finished")
    } else if (getPropertyValue('meta.state') == "Battle" && getPropertyValue("battle.opponentA.enemy_bar_synced_hp") > 0) {
        setPropertyValue('meta.stateEnemy', "Pokemon in Battle")
    } else if (getPropertyValue('meta.state') == "Battle" && getPropertyValue("battle.opponentA.enemy_bar_synced_hp") == 0) {
        setPropertyValue('meta.stateEnemy', "Pokemon Fainted")
    }

    // BATTLE TYPE PROPERTY
    if (getPropertyValue('meta.state') == 'Battle') {
        if (getPropertyValue('battle.opponentA.trainer') == undefined) {
            setPropertyValue('battle.type', 'Wild')
        } else {
            setPropertyValue('battle.type', 'Trainer')
        }
    } else {
        setPropertyValue('battle.type', 'None')
    }

    // Loop through various party-structures to decrypt the Pokemon data
    const partyStructures = ["player", "playerAlt", "wild", "opponentA", "ally", "opponentB", "updPlr", "updOpA",];
    for (let i = 0; i < partyStructures.length; i++) {
        let user = partyStructures[i];
        // Determine the offset from the base_ptr (global_pointer) - only run once per party-structure loop
        const offsets = {
            player: 0xD094,
            playerAlt: 0x35514,
            wild: 0x35AC4,
            opponentA: 0x7A0,
            ally: 0x7A0 + 0x5B0,
            opponentB: 0x7A0 + 0xB60,
            updPlr: 0x5888C, //requires testing
            updOpA: 0x58E3C, //requires testing
        };

        let baseAddress = (user === "opponentA" || user === "ally" || user === "opponentB") ? enemy_ptr : base_ptr;

        // Loop through each party-slot within the given party-structure
        for (let slotIndex = 0; slotIndex < 6; slotIndex++) {
            // Initialize an empty array to store the decrypted data
            let decryptedData = new Array(236).fill(0x00);

            // base_ptr and enemy_ptr is sometimes zero, after a game reset.
            // We don't want to process these if that's the case.
            if (baseAddress == 0 || baseAddress < 0x2000000 || baseAddress >= 1717986918) {
                // Put in safeguards for base address when a new game is loaded.
                // This can sometimes cause enemy_ptr or base_ptr to have invalid values.

                // console.warn(`Base address for ${user} / slot ${slotIndex} is out of range, skipping.`)
            } else {
                let startingAddress = baseAddress + offsets[user] + (236 * slotIndex);

                let encryptedData = memory.defaultNamespace.getBytes(startingAddress, 236); // Read the Pokemon's data (236-bytes)
                let pid = encryptedData.get_uint32_le(); // PID = Personality Value
                let checksum = encryptedData.get_uint16_le(6); // Used to initialize the prngSeed

                for (let i = 0; i < 8; i++) { // Transfer the unencrypted data to the decrypted data array
                    decryptedData[i] = encryptedData.get_byte(i);
                }

                // Begin the decryption process for the block data
                let prngSeed = checksum; // Initialized the prngSeed as the checksum
                for (let i = 0x08; i < 0x88; i += 2) {
                    let prngFunction = prngNext(prngSeed); // Seed prng calculation
                    let key = prngFunction.value; // retrieve the upper 16-bits as the key for decryption
                    prngSeed = Number((0x41C64E6Dn * BigInt(prngSeed) + 0x6073n) & 0xFFFFFFFFn); // retrieve the next seed value and write it back to the prngSeed
                    let data = encryptedData.get_uint16_le(i) ^ key; // XOR the data with the key to decrypt it
                    decryptedData[i + 0] = data & 0xFF; // isolate the lower 8-bits of the decrypted data and write it to the decryptedData array (1 byte)
                    decryptedData[i + 1] = data >> 8; // isolate the upper 8-bits of the decrypted data and write it to the decryptedData array (1 byte)
                }

                // Determine how the block data is shuffled   
                const shuffleId = ((pid & 0x3E000) >> 0xD) % 24; // Determine the shuffle order index
                let shuffleOrder = shuffleOrders[shuffleId]; // Recall the shuffle order
                if (!shuffleOrder) {
                    throw new Error("The PID returned an unknown substructure order.");
                }
                let dataCopy = decryptedData.slice(0x08, 0x88); // Initialize a copy of the decrypted data

                // Unshuffle the block data
                for (let i = 0; i < 4; i++) {
                    // Copy the shuffled blocks into the decryptedData
                    decryptedData.splice(0x08 + i * 0x20, 0x20, ...dataCopy.slice(shuffleOrder[i] * 0x20, shuffleOrder[i] * 0x20 + 0x20));
                }

                // Decrypting the battle stats
                prngSeed = pid; // The seed is the pid this time
                for (let i = 0x88; i < 0xEB; i += 2) {
                    // this covers the remainder of the 236 byte structure
                    let prngFunction = prngNext(prngSeed); // as before
                    let key = prngFunction.value;

                    // Number and BigInt are required so Javascript stores the prngSeed as an accurate value (it is very large)
                    prngSeed = Number((0x41C64E6Dn * BigInt(prngSeed) + 0x6073n) & 0xFFFFFFFFn);

                    let data = encryptedData.get_uint16_le(i) ^ key;
                    decryptedData[i + 0] = data & 0xFF;
                    decryptedData[i + 1] = data >> 16;
                }
            }

            // Fills the memory contains for the mapper's class to interpret
            memory.fill(`${user}_party_structure_${slotIndex}`, 0x00, decryptedData)
        }
    }
}
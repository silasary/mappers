import { 
    variables, 
    memory, 
    // console,
    setValue, 
    getValue 
} from "../common";

export function getBits(a: number, b: number, d: number): number {
    return (a >> b) & ((1 << d) - 1);
}

// prng function; used for decryption.
function prngNext(prngSeed: number) {
    // Ensure 32-bit unsigned result
    const newSeed = (0x41C64E6D * prngSeed + 0x6073) >>> 0;
    const value = (newSeed >>> 16) & 0xFFFF;

    return { newSeed, value }
}

// Block shuffling orders - used for Party structure encryption and decryption
// Once a Pokemon's data has been generated it is assigned a PID which determines the order of the blocks
// The Pokemon's PID never changes, therefore the order of the blocks remains fixed for that Pokemon
const shuffleOrders = {
    0:  [0, 1, 2, 3],
    1:  [0, 1, 3, 2],
    2:  [0, 2, 1, 3],
    3:  [0, 3, 1, 2],
    4:  [0, 2, 3, 1],
    5:  [0, 3, 2, 1],
    6:  [1, 0, 2, 3],
    7:  [1, 0, 3, 2],
    8:  [2, 0, 1, 3],
    9:  [3, 0, 1, 2],
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

export function getMetaState(): string {
    // FSM FOR GAMESTATE TRACKING
    // MAIN GAMESTATE: This tracks the three basic states the game can be in.
    // 1. "No Pokemon": cartridge reset; player has not received a Pokemon
    // 2. "Overworld": Pokemon in party, but not in battle
    // 3. "Battle": In battle
    // 4. "To Battle": not yet implemented //TODO: Implement the To Battle state, this requires a new property to accurately track it
    // 5. "From Battle": not yet implemented
    const team_count: number = getValue<number>('player.team_count')
    const active_pokemonPv: number = getValue<number>('battle.player.active_pokemon.internals.personality_value')
    const teamPokemonPv: number = getValue<number>('player.team.0.internals.personality_value')
    const teamNickname: number = getValue<number>('player.team.0.nickname') //TODO: remove these once all properties are mapped - HGSS and Plat should have the same state functions
    const battleNickname: number = getValue<number>('battle.player.active_pokemon.nickname') //TODO: remove these once all properties are mapped - HGSS and Plat should have the same state functions
    const outcome_flags: number = getValue<number>('battle.other.outcome_flags')
    if (team_count === 0) {
        return 'No Pokemon'
    }
    else if (active_pokemonPv === teamPokemonPv && outcome_flags == 1) {
        return 'From Battle'
    }
    else if (active_pokemonPv === teamPokemonPv) {
        return 'Battle'
    }
    else if (teamNickname !== battleNickname) {
        return 'Overworld'
    }
    return 'No Pokemon'
}

export function getMetaEnemyState(state: string, battle_outcomes: number, enemyBarSyncedHp: number): string | null {
    // ENEMY POKEMON MID-BATTLE STATE: Allows for precise timing during battles
    if (state === "No Pokemon" || state === "Overworld") return 'N/A'
    else if (state === "Battle" && battle_outcomes === 1) return 'Battle Finished'
    else if (state === "Battle" && enemyBarSyncedHp > 0) return 'Pokemon In Battle'
    else if (state === "Battle" && enemyBarSyncedHp === 0) return 'Pokemon Fainted'
    return null
}

export function getBattleMode(state: string, opponentTrainer: string | null): string | null {
    if (state === 'Battle') {
        if (opponentTrainer === null) return 'Wild'
        else return 'Trainer'
    } else {
        return null
    }
}

export function getBattleOutcome(): string | null {
    const outcome_flags: number = getValue('battle.other.outcome_flags')
    const state: string = getMetaState()
    switch (state) {
        case 'From Battle':
            switch (outcome_flags) {
                case 1:
                    return 'Win'
                default:
                    return null
            }
    }
    return null
}

/** Calculate the encounter rate based on other variables */
export function getEncounterRate(): number {
    const walking: number = getValue("overworld.encounter_rates.walking");
    // Need properties to correctly determine which of these to return
    // const surfing = getValue("overworld.encounter_rates.surfing");
    // const old_rod = getValue("overworld.encounter_rates.old_rod");
    // const good_rod = getValue("overworld.encounter_rates.good_rod");
    // const super_rod = getValue("overworld.encounter_rates.super_rod");
    return walking;
}

// Preprocessor runs every loop (everytime gamehook updates)
export function preprocessor() {
    // This is the same as the global_pointer, it is named "base_ptr" for consistency with the old C# code    
    const base_ptr: number = memory.defaultNamespace.get_uint32_le(0x211186C) //HGSS pointer

    if (base_ptr === 0) {
        // Ends logic is the base_ptr is 0, this is to prevent errors during reset and getting on a bike.
        variables.global_pointer = null
        return
    }
    
    variables.global_pointer = base_ptr // Variable used for mapper addresses, it is the same as "base_ptr"
    const enemy_ptr = memory.defaultNamespace.get_uint32_le(base_ptr + 0x37970) // Only needs to be calculated once per loop

    // Set property values
    const metaState: string = getMetaState()
    const battle_outcomes: number = getValue<number>('battle.outcome')
    const enemyBarSyncedHp: number = getValue<number>('battle.opponent.enemy_bar_synced_hp')
    const opponentTrainer: string | null = getValue<string | null>('battle.opponent.trainer')
    setValue('meta.state', metaState)
    setValue('battle.mode', getBattleMode(metaState, opponentTrainer))
    setValue('meta.state_enemy', getMetaEnemyState(metaState, battle_outcomes, enemyBarSyncedHp))
    setValue('overworld.encounter_rate', getEncounterRate())

    // Loop through various party-structures to decrypt the Pokemon data
    const partyStructures = [
        "player", "static_wild",
        // "static_player", "static_opponent", "static_ally", "static_opponent_2",
        "dynamic_player", "dynamic_opponent", "dynamic_ally", "dynamic_opponent_2",
    ];
    for (let i = 0; i < partyStructures.length; i++) {
        let user = partyStructures[i];

        //Pointer: 0x226F2A8 (testing global_pointer value)
        // Determine the offset from the base_ptr (global_pointer) - only run once per party-structure loop
        // Updating structures start offset from the global_pointer by 0x5BA78; they are 0x5B0 bytes long
        // team_count is always offset from the start of the team structure by -0x04 and it's a 1-byte value
        const offsets = {
            player: 0xD088,
            //static team structures
            static_player: 0x37B24, //located at 0x22A6DCC 
            static_wild: 0x38540,
            static_opponent: 0x1C70, //TODO: needs testing
            static_ally: 0x1C70 + 0x1438, //TODO: needs testing
            static_opponent_2: 0x1C70 + 0xA1C, //TODO: needs testing
            //dynamic team structures
            dynamic_player: 0x5BA78,
            dynamic_opponent: 0x5C028,
            dynamic_ally: 0x5BA78 + (0x5D0 * 2),
            dynamic_opponent_2: 0x5BA78 + (0x5D0 * 3),
        };

        let baseAddress = (user === "static_opponent" || user === "static_ally" || user === "static_opponent_2") ? enemy_ptr : base_ptr;

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

                let encryptedData = memory.defaultNamespace.get_bytes(startingAddress, 236); // Read the Pokemon's data (236-bytes)
                let pid = encryptedData.get_uint32_le(); // PID = Personality Value
                let checksum = encryptedData.get_uint16_le(6); // Used to initialize the prngSeed

                // Transfer the unencrypted data to the decrypted data array
                for (let i = 0; i < 8; i++) {
                    decryptedData[i] = encryptedData.get_byte(i);
                }

                // Begin the decryption process for the block data
                // Initialized the prngSeed as the checksum
                let prngSeed = checksum;
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
                    decryptedData[i + 1] = (data >> 8) & 0xFF;
                }
            }

            // Fills the memory contains for the mapper's class to interpret
            // console.info(`Filling memory for ${user} / slot ${slotIndex}`)
            // console.info(`${decryptedData.length}`)
            memory.fill(`${user}_party_structure_${slotIndex}`, 0x00, decryptedData)
            // console.info("Done filling memory")
        }
    }
}
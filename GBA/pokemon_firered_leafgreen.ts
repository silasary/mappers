import { 
    variables, 
    memory,
    // state, 
    // console,
    getValue,
    setValue
 } from "../common";

export { BitRange } from '../common';

// //Decryption Functions
// //16-bit and 32-bit data access functions
// function DATA16_LE(data: number[], offset: number) { 
//     let val = (data[offset] << 0) | (data[offset + 1] << 8);
//     return val & 0xFFFF;
// }

function DATA32_LE(data: number[], offset: number) {
    let val = (data[offset] << 0)
        | (data[offset + 1] << 8)
        | (data[offset + 2] << 16)
        | (data[offset + 3] << 24);
    return val >>> 0;
}

// function getTotalgame_time(): number {
//     return (
//         (216000 * memory.defaultNamespace.get_byte(variables.dma_b + 14)) +
//         (  3600 * memory.defaultNamespace.get_byte(variables.dma_b + 16)) +
//         (    60 * memory.defaultNamespace.get_byte(variables.dma_b + 17)) +
//                   memory.defaultNamespace.get_byte(variables.dma_b + 18)
//     );
// }

export function decryptItemQuantity(x: number) {
    let quantity_key: number = memory.defaultNamespace.get_uint16_le(variables.dma_b + 0xAC);
    return x ^ quantity_key;
}

// function equalArrays(a1: number[], a2: number[]) {
//     if (a1 === undefined || a2 === undefined) return a1 == a2;
//     if (a1.length != a2.length) return false;
//     for (let i = 0; i < a1.length; i++){
//         if (a1[i] != a2[i]) return false;
//     }
//     return true;
// }

// Block shuffling orders - used for Party structure encryption and decryption
// Once a Pokemon's data has been generated it is assigned a PID which determines the order of the blocks
// As the Pokemon's PID never changes, the order of the blocks always remains the same for that Pokemon
// Each individial Pokemon receives its own unique shuffle order
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
    // 3. "To Battle": Battle has started but player hasn't sent their Pokemon in yet
    // 4. "From Battle": Battle result has been decided but the battle has not transition to the overworld yet
    // 5. "Battle": In battle
    const team_0_level: number = getValue('player.team.0.level')
    const callback_1: string = getValue('pointers.callback_1')
    const callback_2: string = getValue('pointers.callback_2')
    const battle_outcomes: string = getValue('battle.other.battle_outcomes')
    // const battle_dialogue: string = getValue('battle.other.battle_dialogue')
    // const state: string = getValue('meta.state') ?? "No Pokemon"
    if (team_0_level == 0) 
        return "No Pokemon"
    else if (callback_2 == "Battle Animation")
        return "To Battle"
    else if (callback_1 == "Overworld")
        return "Overworld"
    else if (callback_1 == "Battle") {
        if (battle_outcomes != null) {
            return "From Battle"
        }
        return "Battle"
    }
    return "Error"
}

export function getBattleOutcome(): string | null {
    const outcome_flags: string | null = getValue('battle.other.battle_outcomes')
    const state: string = getMetaState()
    switch (state) {
        case 'From Battle':
            switch (outcome_flags) {
                case "WON":
                    return 'Win'
                case "LOST":
                    return 'Lose'
                case "DRAW":
                    return 'Flee'
                case "RAN":
                    return 'Flee'
                case "PLAYER_TELEPORTED":
                    return 'Flee'
                case "POKEMON_FLED":
                    return 'Flee'
                case "CAUGHT":
                    return 'Caught'
                case "NO_SAFARI_BALLS":
                    return 'Flee'
                case "FORFEITED":
                    return 'Flee'
                case "POKEMON_TELEPORTED":
                    return 'Flee'
                default:
                    return null
            }
        }
    return null
}

export function preprocessor() {
    variables.dma_a = memory.defaultNamespace.get_uint32_le(0x3005008)
    variables.dma_b = memory.defaultNamespace.get_uint32_le(0x300500C)
    variables.dma_c = memory.defaultNamespace.get_uint32_le(0x3005010)
    setValue('meta.state', getMetaState())
    setValue('battle.outcome', getBattleOutcome())
    
    //DECRYPTION OF THE PARTY POKEMON
    //This process applies to all the the Player's Pokemon as well as to Pokemon loaded NPCs parties
    //All Pokemon have a data structure of 100-bytes
    //Only 48-bytes of data are encrypted and shuffled in generation 3
    const partyStructures = ["player", "opponentA"];
    for (let i = 0; i < partyStructures.length; i++) {
        let user = partyStructures[i];

        for (let slotIndex = 0; slotIndex < 6; slotIndex++) {
             //Determine the starting address for the party we are decrypting
            let startingAddress = 0
            if (user == "player") {
                startingAddress = 0x2024284 + (100 * slotIndex); 
            }
            if (user == "opponentA") {
                startingAddress = 0x202402C + (100 * slotIndex); 
            }

            let pokemonData = memory.defaultNamespace.get_bytes(startingAddress, 100)
            let pid = pokemonData.get_uint32_le();
            let ot_id = pokemonData.get_uint32_le(4);

            let decryptedData = [] as number[]
            for (let i = 0; i < 100; i++) { //Transfer the first 32-bytes of unencrypted data to the decrypted data array
                decryptedData[i] = pokemonData.data[i];
            }

            //Begin the decryption process for the block data
            let key = ot_id ^ pid; //Calculate the encryption key using the Oritinal Trainer ID XODed with the PID
            for (let i = 32; i < 80; i += 4) {
                let data = DATA32_LE(pokemonData.data, i) ^ key; //XOR the data with the key
                decryptedData[i + 0] = data & 0xFF;         // Isolates the least significant byte
                decryptedData[i + 1] = (data >> 8) & 0xFF;  // Isolates the 2nd least significant byte
                decryptedData[i + 2] = (data >> 16) & 0xFF; // Isolates the 3rd least significant byte
                decryptedData[i + 3] = (data >> 24) & 0xFF; // Isolates the most significant byte
            }

            //Determine how the block data is shuffled   
            const shuffleId = pid % 24; //Determine the shuffle order index
            let shuffleOrder = shuffleOrders[shuffleId]; //Recall the shuffle order
            if (!shuffleOrder) {
                throw new Error("The PID returned an unknown substructure order.");
            }

            let dataCopy = Array.from(decryptedData) // Initialize a copy of the decrypted data (48-bytes only)
            decryptedData = Array.from(decryptedData)
            dataCopy = dataCopy.splice(32, 48);
            //Unshuffle the block data
            for (let i = 0; i < 4; i++) { // Copy the shuffled blocks into the decryptedData
                decryptedData.splice(32 + i * 12, 12, ...dataCopy.slice(shuffleOrder[i] * 12, shuffleOrder[i] * 12 + 12));
            }

            //Transfer the remaining 20-bytes of unencrypted data to the decrypted data array
            for (let i = 80; i < 100; i++) { 
                decryptedData[i] = pokemonData.data[i];
            }

            //Fills the memory contains for the mapper's class to interpret
            memory.fill(`${user}_party_structure_${slotIndex}`, 0x00, decryptedData) 
        }
    }
}
"use strict";

function getPropertyValue(path) {
    if (mapper.properties[path] === undefined) { throw new Error(`${path} is not defined in properties.`) }
    return mapper.properties[path].value
}

function setPropertyValue(path, value) {
    if (mapper.properties[path] === undefined) { throw new Error(`${path} is not defined in properties.`) }
    mapper.properties[path].value = value
}

//Decryption Functions
//16-bit and 32-bit data access functions
function DATA16_LE(data, offset) {
    let val = (data[offset] << 0) | (data[offset + 1] << 8);
    return val & 0xFFFF;
}

function DATA32_LE(data, offset) {
    let val = (data[offset] << 0)
        | (data[offset + 1] << 8)
        | (data[offset + 2] << 16)
        | (data[offset + 3] << 24);
    return val >>> 0;
}
function DATA16_BE(data, offset) {
    let val = (data[offset] << 8) | (data[offset + 1] << 0);
    return val & 0xFFFF;
}
function DATA32_BE(data, offset) {
    let val = (data[offset] << 24)
        | (data[offset + 1] << 16)
        | (data[offset + 2] << 8)
        | (data[offset + 3] << 0);
    return val >>> 0;
}
function BitRange(data, end_pos, start_pos) {
    let mask = ((1 << (end_pos - start_pos + 1)) - 1) << start_pos;
    return (data & mask) >> start_pos;
}

function getTotalGameTime(){
    return (
        (216000 * memory.defaultNamespace.get_byte(variables.dma_b + 14)) +
        (  3600 * memory.defaultNamespace.get_byte(variables.dma_b + 16)) +
        (    60 * memory.defaultNamespace.get_byte(variables.dma_b + 17)) +
                  memory.defaultNamespace.get_byte(variables.dma_b + 18)
    );
}

function decryptItemQuantity(x) {
    let quantity_key = memory.defaultNamespace.get_uint16_le(variables.dma_b + 0xAC);
    return x ^ quantity_key;
}

function equalArrays(a1, a2){
    if (a1 === undefined || a2 === undefined) return a1 == a2;
    if (a1.length != a2.length) return false;
    for (let i = 0; i < a1.length; i++){
        if (a1[i] != a2[i]) return false;
    }
    return true;
}

//Block shuffling orders - used for Party structure encryption and decryption
//Once a Pokemon's data has been generated it is assigned a PID which determines the order of the blocks
//As the Pokemon's PID never changes, the order of the blocks always remains the same for that Pokemon
//Each individial Pokemon receives its own unique shuffle order
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

function preprocessor() {
    variables.dma_a = memory.defaultNamespace.get_uint32_le(0x3005D8C);
    variables.dma_b = memory.defaultNamespace.get_uint32_le(0x3005D90);
    variables.dma_c = memory.defaultNamespace.get_uint32_le(0x3005D94);
    variables.quantity_decryption_key = memory.defaultNamespace.get_uint16_le(variables.dma_b + 172);
    variables.callback1 = memory.defaultNamespace.get_uint32_le(0x30022C0);
    variables.callback2 = memory.defaultNamespace.get_uint32_le(0x30022C4);

    if (state.cached_dma_a === undefined) {
        state.dma_update_delay = 0;
    } else if (
            state.cached_dma_a != variables.dma_a ||
            state.cached_dma_b != variables.dma_b ||
            state.cached_dma_c != variables.dma_c ||
            state.cached_quantity_decryption_key != variables.quantity_decryption_key
    ){
        console.log("DMA change detected/expected");
        state.dma_delay_init = getTotalGameTime();
        state.dma_update_delay = getTotalGameTime() + 90;
    }

    state.cached_dma_a = variables.dma_a;
    state.cached_dma_b = variables.dma_b;
    state.cached_dma_c = variables.dma_c;
    state.cached_quantity_decryption_key = variables.quantity_decryption_key;

    if (state.dma_update_delay != 0){
        let game_time = getTotalGameTime();
        if (state.dma_update_delay > game_time){
            return false;
        } else if (state.dma_delay_init > game_time) {
            console.log("Impossible game_time detected. Assuming player reset or loaded a save state. Lifting block");
            state.dma_update_delay = 0;
        } else {
            console.log("DMA should be ready now, lifting block on updates");
            state.dma_update_delay = 0;
        }
    }

    //DECRYPTION OF THE PARTY POKEMON
    //This process applies to all the the Player's Pokemon as well as to Pokemon loaded NPCs parties
    //All Pokemon have a data structure of 100-bytes
    //Only 48-bytes of data are encrypted and shuffled in generation 3
    const partyStructures = ["player", "opponentA"];
    if (state.cached_pokemon === undefined) {
        state.cached_pokemon = {
            "player": {0: {raw_data: "", decrypted_data: ""}, 1: {raw_data: "", decrypted_data: ""}, 2: {raw_data: "", decrypted_data: ""}, 3: {raw_data: "", decrypted_data: ""}, 4: {raw_data: "", decrypted_data: ""}, 5: {raw_data: "", decrypted_data: ""}},
            "opponentA": {0: {raw_data: "", decrypted_data: ""}, 1: {raw_data: "", decrypted_data: ""}, 2: {raw_data: "", decrypted_data: ""}, 3: {raw_data: "", decrypted_data: ""}, 4: {raw_data: "", decrypted_data: ""}, 5: {key: "", decrypted_data: ""}},
        };
        state.blank_pokemon = new Array(100).fill(0x00);
    }
    for (let i = 0; i < partyStructures.length; i++) {
        let user = partyStructures[i];

        let activeMonIndexAddress = 0;
        if (user == "opponentA") {
            activeMonIndexAddress = 0x2024070;
        }

        for (let slotIndex = 0; slotIndex < 6; slotIndex++) {
            //Determine the starting address for the party we are decrypting
            let startingAddress = 0;
            if (user == "player") {
                startingAddress = 0x20244EC + (100 * slotIndex);
            }
            // TODO: do we need to handle opponentB as well?
            if (user == "opponentA") {
                startingAddress = 0x2024744 + (100 * slotIndex);
            }

            let pokemonData = memory.defaultNamespace.getBytes(startingAddress, 100);
            // Compare the raw data against the cached raw data. Skip decryption and rely on cache if identical
            if (equalArrays(state.cached_pokemon[user][slotIndex]["raw_data"], pokemonData.Data)) {
                memory.fill(`${user}_party_structure_${slotIndex}`, 0x00, state.cached_pokemon[user][slotIndex]["decrypted_data"]);
                continue;
            }

            let pid = pokemonData.get_uint32_le();
            let otid = pokemonData.get_uint32_le(4);

            let decrypted_data = []
            for (let i = 0; i < 100; i++) { //Transfer the first 32-bytes of unencrypted data to the decrypted data array
                decrypted_data[i] = pokemonData.Data[i];
            }

            //Begin the decryption process for the block data
            let key = otid ^ pid; //Calculate the encryption key using the Oritinal Trainer ID XODed with the PID
            for (let i = 32; i < 80; i += 4) {
                let data = DATA32_LE(pokemonData.Data, i) ^ key; //XOR the data with the key
                decrypted_data[i + 0] = data & 0xFF;         // Isolates the least significant byte
                decrypted_data[i + 1] = (data >> 8) & 0xFF;  // Isolates the 2nd least significant byte
                decrypted_data[i + 2] = (data >> 16) & 0xFF; // Isolates the 3rd least significant byte
                decrypted_data[i + 3] = (data >> 24) & 0xFF; // Isolates the most significant byte
            }

            //Determine how the block data is shuffled   
            const shuffleId = pid % 24; //Determine the shuffle order index
            let shuffleOrder = shuffleOrders[shuffleId]; //Recall the shuffle order
            if (!shuffleOrder) {
                throw new Error("The PID returned an unknown substructure order.");
            }

            let dataCopy = Array.from(decrypted_data);
            decrypted_data = Array.from(decrypted_data);
            dataCopy = dataCopy.splice(32, 48);
            //Unshuffle the block data
            for (let i = 0; i < 4; i++) { // Copy the shuffled blocks into the decrypted_data
                decrypted_data.splice(32 + i * 12, 12, ...dataCopy.slice(shuffleOrder[i] * 12, shuffleOrder[i] * 12 + 12));
            }

            //Transfer the remaining 20-bytes of unencrypted data to the decrypted data array
            for (let i = 80; i < 100; i++) {
                decrypted_data[i] = pokemonData.Data[i];
            }

            // special case: if the solo mon species gets set to an invalid id, we probably don't want this update
            // 2 bytes at 32 offset are the species value, and there are only 414 pokemon
            // NOTE: this can still fail if the player's species gets randomly set to a value under 414. However, this should be very rare
            if (user == "player" && slotIndex == 0 && DATA16_LE(decrypted_data, 32) > 415) {
                console.log("Junk solo mon data detected. Delaying update...");
                return false;
            }

            state.cached_pokemon[user][slotIndex]["raw_data"] = pokemonData.Data;
            state.cached_pokemon[user][slotIndex]["decrypted_data"] = decrypted_data;
            memory.fill(`${user}_party_structure_${slotIndex}`, 0x00, decrypted_data);
        }

        if (activeMonIndexAddress != 0) {
            let activeIndex = memory.defaultNamespace.get_uint16_le(activeMonIndexAddress);
            console.log("Got active index of ");
            console.log(activeIndex);
            if (activeIndex < 0 || activeIndex >= 6 ) {
                memory.fill(`${user}_party_structure_active_pokemon`, 0x00, state.blank_pokemon);
            } else {
                console.log(state.cached_pokemon[user][activeIndex]["decrypted_data"]);
                memory.fill(`${user}_party_structure_active_pokemon`, 0x00, state.cached_pokemon[user][activeIndex]["decrypted_data"]);
            }
        }

    }
    return true;
}
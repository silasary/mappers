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
//prng function; used for decryption
function prngNext(prngSeed) {
    let newSeed = (0x41C64E6D * prngSeed + 0x6073) >>> 0; // Ensure 32-bit unsigned result
    let result = (newSeed >>> 16) & 0xFFFF;
    return {
        newSeed: newSeed,
        value: result
    };
}
//Block shuffling orders
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
    //Defining the global pointer used in all preprocessor tasks
    // (value = 36114872 (0x22711B8) for my testing save file - Scott's Thoughts)
    state.global_pointer = DATA32_LE(memory.getBytes(0x02101D2C, 4), 0)
    const base_ptr = DATA32_LE(memory.getBytes(0x02101D2C, 4), 0)

    //ASSIGNMENT OF OFFSETS BASED ON THE GLOBAL POINTER FOR MAPPER CONVIENIENCE
    state.player_items = state.global_pointer + 0xD624
    state.player_medicine = state.global_pointer + 0xDB40
    state.player_balls = state.global_pointer + 0xDCE0
    state.player_tmhm = state.global_pointer + 0xD980
    state.player_berries = state.global_pointer + 0xDBE0
    state.battle_player1 = state.global_pointer + 0x54598
    state.battle_player2 = undefined
    state.battle_enemy1 = state.global_pointer + 0x54658
    state.battle_enemy2 = undefined

    //DECRYPTION OF THE PLAYER'S PARTY POKEMON
    //Read the value of the base pointer (the global pointer for everything)
    //Manages errors if the memory range is outside of GameHook's available memory addresses
    if (base_ptr < 0x2000000) { 
        console.warn("base_ptr value outside of GameHook's available memory addresses: " + base_ptr.toString(16))
        return
    }
    //Loop through all six party slots (0-5) decrypting both the blocks and the battle stats
    for (let slotIndex = 0; slotIndex < 6; slotIndex++) {
        let startingAddress = base_ptr + 0xD094 + (236 * slotIndex); //Determine the starting address for the party slot we are decrypting
        let encryptedData = memory.getBytes(startingAddress, 236); //Use the starting address to read the Pokemon's full data structure (236 bytes)
        let pid = DATA32_LE(encryptedData, 0x00); //Pokemon's Personality Value (outside of the encryption)
        let checksum = DATA16_LE(encryptedData, 0x06); //Pokemon's Checksum (outside of the encryption)
        let decryptedData = [] //Initialize an empty array to store the decrypted data
        for (let i = 0; i < 8; i++) { //Transfer the unencrypted data to the decrypted data array
            decryptedData[i] = encryptedData[i];
        }

        //Begin the decryption process for the block data
        let prngSeed = checksum; //Initialized the prngSeed as the checksum
        let key = 0; //Initialize the key
        let data = 0; //Initialize the data
        for (let i = 0x08; i < 0x88; i += 2) {
            let prngFunction = prngNext(prngSeed); //Seed prng calculation
            key = prngFunction.value; //retrieve the upper 16-bits as the key for decryption
            prngSeed = Number((0x41C64E6Dn * BigInt(prngSeed) + 0x6073n) & 0xFFFFFFFFn); //retrieve the next seed value and write it back to the prngSeed
            data = DATA16_LE(encryptedData, i) ^ key; //XOR the data with the key to decrypt it
            decryptedData[i + 0] = data & 0xFF; //isolate the lower 8-bits of the decrypted data and write it to the decryptedData array (1 byte)
            decryptedData[i + 1] = data >> 8; //isolate the upper 8-bits of the decrypted data and write it to the decryptedData array (1 byte)
        }

        //Determine how the block data is shuffled   
        const shuffleId = ((pid & 0x3E000) >> 0xD) % 24; //Determine the shuffle order index
        let shuffleOrder = shuffleOrders[shuffleId]; //Recall the shuffle order
        if (!shuffleOrder) {
            throw new Error("The PID returned an unknown substructure order.");
        }
        let dataCopy = decryptedData.slice(0x08, 0x88); // Initialize a copy of the decrypted data
        //Unshuffle the block data
        for (let i = 0; i < 4; i++) { // Copy the shuffled blocks into the decryptedData
            decryptedData.splice(0x08 + i * 0x20, 0x20, ...dataCopy.slice(shuffleOrder[i] * 0x20, shuffleOrder[i] * 0x20 + 0x20));
        }

        //Decrypting the battle stats
        prngSeed = pid; //The seed is the pid this time
        for (let i = 0x88; i < 0xEB; i += 2) { //this covers the remainder of the 236 byte structure
            let prngFunction = prngNext(prngSeed); //as before
            key = prngFunction.value;
            prngSeed = Number((0x41C64E6Dn * BigInt(prngSeed) + 0x6073n) & 0xFFFFFFFFn);
            data = DATA16_LE(encryptedData, i) ^ key;
            decryptedData[i + 0] = data & 0xFF;
            decryptedData[i + 1] = data >> 16; //!Confirm this does not need 8-bit shift
        }
        //! TODO: Feed the decrypted information back to GameHook so it can use it for properties
    }
}

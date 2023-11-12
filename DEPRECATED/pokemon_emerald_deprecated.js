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

function BitRange(bits, upperRange, lowerRange) {
    return (bits & ((1 << (upperRange + 1)) - 1)) >> lowerRange;
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
    variables.dma_a = memory.defaultNamespace.get_uint32_le(0x3005D8C)
    variables.dma_b = memory.defaultNamespace.get_uint32_le(0x3005D90)
    variables.dma_c = memory.defaultNamespace.get_uint32_le(0x3005D94)
    variables.callback1 = memory.defaultNamespace.get_uint32_le(0x30022C0)
    variables.callback2 = memory.defaultNamespace.get_uint32_le(0x30022C4)

    //DECRYPTION OF THE PARTY POKEMON
    //This process applies to all the the Player's Pokemon as well as to Pokemon loaded NPCs parties
    //All Pokemon have a data structure of 100-bytes
    //Only 48-bytes of data are encrypted and shuffled in generation 3
    const partyStructures = ["player", "playerAlt", "opponentA"];
    for (let i = 0; i < partyStructures.length; i++) {
        let user = partyStructures[i];

        for (let slotIndex = 0; slotIndex < 6; slotIndex++) {
            //Determine the starting address for the party we are decrypting
            let startingAddress = 0
            if (user == "player") {
                startingAddress = 0x20244EC + (100 * slotIndex);
            }
            if (user == "playerAlt") {
                startingAddress = 0x20244EC + (100 * slotIndex);
            }
            if (user == "opponentA") {
                startingAddress = 0x2024744 + (100 * slotIndex); //address needed
            }

            let pokemonData = memory.defaultNamespace.getBytes(startingAddress, 100)
            let pid = pokemonData.get_uint32_le();
            let otid = pokemonData.get_uint32_le(4);
            let checksum = pokemonData.get_uint16_le(28);

            let decryptedData = []
            for (let i = 0; i < 100; i++) { //Transfer the first 32-bytes of unencrypted data to the decrypted data array
                decryptedData[i] = pokemonData.Data[i];
            }

            //Begin the decryption process for the block data
            let key = otid ^ pid; //Calculate the encryption key using the Oritinal Trainer ID XODed with the PID
            for (let i = 32; i < 80; i += 4) {
                let data = DATA32_LE(pokemonData.Data, i) ^ key; //XOR the data with the key
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
                decryptedData[i] = pokemonData.Data[i];
            }

            //Fills the memory contains for the mapper's class to interpret
            memory.fill(`${user}_party_structure_${slotIndex}`, 0x00, decryptedData)
        }
    }
}
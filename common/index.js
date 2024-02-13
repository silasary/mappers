/**
 * Represents a console interface with logging methods.
 * @class
 */
class IConsole {
    /**
     * Logs a message to the console.
     * @param {string} message - The message to log.
     */
    log(message) { }

    /**
     * Logs a trace message to the console.
     * @param {string} message - The trace message to log.
     */
    trace(message) { }

    /**
     * Logs a debug message to the console.
     * @param {string} message - The debug message to log.
     */
    debug(message) { }

    /**
     * Logs an informational message to the console.
     * @param {string} message - The info message to log.
     */
    info(message) { }

    /**
     * Logs a warning message to the console.
     * @param {string} message - The warning message to log.
     */
    warn(message) { }

    /**
     * Logs an error message to the console.
     * @param {string} message - The error message to log.
     */
    error(message) { }
}

/**
 * Represents a memory interface with methods for accessing memory.
 * @class
 */
class IMemory {
    /**
     * Represents the default namespace for memory operations.
     * @namespace
     */
    defaultNamespace = {
        /**
         * Gets an unsigned 16-bit integer from the memory at the specified address in little-endian format.
         * @param {number} memoryAddress - The memory address to read from.
         * @returns {number} The unsigned 16-bit integer value.
         */
        get_uint16_le(memoryAddress) { },

        /**
         * Gets an unsigned 16-bit integer from the memory at the specified address in big-endian format.
         * @param {number} memoryAddress - The memory address to read from.
         * @returns {number} The unsigned 16-bit integer value.
         */
        get_uint16_be(memoryAddress) { },

        /**
         * Gets an unsigned 32-bit integer from the memory at the specified address in little-endian format.
         * @param {number} memoryAddress - The memory address to read from.
         * @returns {number} The unsigned 32-bit integer value.
         */
        get_uint32_le(memoryAddress) { },

        /**
         * Gets an unsigned 32-bit integer from the memory at the specified address in big-endian format.
         * @param {number} memoryAddress - The memory address to read from.
         * @returns {number} The unsigned 32-bit integer value.
         */
        get_uint32_be(memoryAddress) { },

        /**
         * Gets an unsigned 64-bit integer from the memory at the specified address in little-endian format.
         * @param {number} memoryAddress - The memory address to read from.
         * @returns {number} The unsigned 64-bit integer value.
         */
        get_uint64_le(memoryAddress) { },

        /**
         * Gets an unsigned 64-bit integer from the memory at the specified address in big-endian format.
         * @param {number} memoryAddress - The memory address to read from.
         * @returns {number} The unsigned 64-bit integer value.
         */
        get_uint64_be(memoryAddress) { },

        /**
         * Gets a byte from the memory at the specified address.
         * @param {number} memoryAddress - The memory address to read from.
         * @returns {number} The byte value.
         */
        get_byte(memoryAddress) { },

        /**
         * Gets an array of bytes from the memory starting at the specified address.
         * @param {number} memoryAddress - The memory address to start reading from.
         * @param {number} length - The length of the byte array to read.
         * @returns {IByteArray} The byte array.
         */
        get_bytes(memoryAddress, length) { }
    };

    /**
     * Fills a memory namespace with the provided data starting at the specified offset.
     * @param {string} namespace - The namespace to fill.
     * @param {number} offset - The offset to start filling from.
     * @param {number[]} data - The data to fill the memory with.
     */
    fill(namespace, offset, data) { }
}

/**
 * Represents a byte array with methods for accessing data.
 * @class
 */
class IByteArray {
    /**
     * Represents the data contained in the byte array.
     * @type {number[]}
     */
    data;

    /**
     * Gets an unsigned 16-bit integer from the byte array in little-endian format.
     * @returns {number} The unsigned 16-bit integer value.
     */
    get_uint16_le() {}

    /**
     * Gets an unsigned 16-bit integer from the byte array in big-endian format.
     * @returns {number} The unsigned 16-bit integer value.
     */
    get_uint16_be() {}

    /**
     * Gets an unsigned 32-bit integer from the byte array in little-endian format.
     * @returns {number} The unsigned 32-bit integer value.
     */
    get_uint32_le() {}

    /**
     * Gets an unsigned 32-bit integer from the byte array in big-endian format.
     * @returns {number} The unsigned 32-bit integer value.
     */
    get_uint32_be() {}

    /**
     * Gets an unsigned 64-bit integer from the byte array in little-endian format.
     * @returns {number} The unsigned 64-bit integer value.
     */
    get_uint64_le() {}

    /**
     * Gets an unsigned 64-bit integer from the byte array in big-endian format.
     * @returns {number} The unsigned 64-bit integer value.
     */
    get_uint64_be() {}

    /**
     * Gets an unsigned 16-bit integer from the byte array at the specified offset in little-endian format.
     * @param {number} offset - The offset to read from.
     * @returns {number} The unsigned 16-bit integer value.
     */
    get_uint16_le(offset) {}

    /**
     * Gets an unsigned 16-bit integer from the byte array at the specified offset in big-endian format.
     * @param {number} offset - The offset to read from.
     * @returns {number} The unsigned 16-bit integer value.
     */
    get_uint16_be(offset) {}

    /**
     * Gets an unsigned 32-bit integer from the byte array at the specified offset in little-endian format.
     * @param {number} offset - The offset to read from.
     * @returns {number} The unsigned 32-bit integer value.
     */
    get_uint32_le(offset) {}

    /**
     * Gets an unsigned 32-bit integer from the byte array at the specified offset in big-endian format.
     * @param {number} offset - The offset to read from.
     * @returns {number} The unsigned 32-bit integer value.
     */
    get_uint32_be(offset) {}

    /**
     * Gets an unsigned 64-bit integer from the byte array at the specified offset in little-endian format.
     * @param {number} offset - The offset to read from.
     * @returns {number} The unsigned 64-bit integer value.
     */
    get_uint64_le(offset) {}

    /**
     * Gets an unsigned 64-bit integer from the byte array at the specified offset in big-endian format.
     * @param {number} offset - The offset to read from.
     * @returns {number} The unsigned 64-bit integer value.
     */
    get_uint64_be(offset) {}

    /**
     * Gets a byte from the byte array at the specified memory address.
     * @param {number} memoryAddress - The memory address to read from.
     * @returns {number} The byte value.
     */
    get_byte(memoryAddress) {}
}

/**
 * Represents a mapper property with various optional attributes.
 * @interface
 */
class IMapperProperty {
    /**
     * The path of the mapper property.
     * @type {string}
     */
    path;

    /**
     * The memory container associated with the mapper property.
     * @type {string | null | undefined}
     */
    memoryContainer;

    /**
     * The address of the mapper property.
     * @type {number | null | undefined}
     */
    address;

    /**
     * The length of the mapper property.
     * @type {number | null | undefined}
     */
    length;

    /**
     * The size of the mapper property.
     * @type {number | null | undefined}
     */
    size;

    /**
     * The bits associated with the mapper property.
     * @type {string | null | undefined}
     */
    bits;

    /**
     * The reference associated with the mapper property.
     * @type {string | null | undefined}
     */
    reference;

    /**
     * The description of the mapper property.
     * @type {string | null | undefined}
     */
    description;

    /**
     * The value associated with the mapper property.
     * @type {* | null | undefined}
     */
    value;

    /**
     * The bytes associated with the mapper property.
     * @type {number[] | null | undefined}
     */
    bytes;

    /**
     * The frozen bytes associated with the mapper property.
     * @type {number[] | null | undefined}
     */
    bytesFrozen;

    /**
     * The read function associated with the mapper property.
     * @type {string | null | undefined}
     */
    readFunction;

    /**
     * The write function associated with the mapper property.
     * @type {string | null | undefined}
     */
    writeFunction;

    /**
     * The expression to evaluate after reading the value associated with the mapper property.
     * @type {string | null | undefined}
     */
    afterReadValueExpression;

    /**
     * The function to execute after reading the value associated with the set command.
     * @type {string | null | undefined}
     */
    afterReadValueFunction;

    /**
     * The function to execute before writing the value associated with the mapper property.
     * @type {string | null | undefined}
     */
    beforeWriteValueFunction;
}

/**
 * Represents a mapper set command with various optional attributes.
 * @interface
 */
class IMapperSetCommand {
    /**
     * The memory container associated with the set command.
     * @type {string | null | undefined}
     */
    memoryContainer;

    /**
     * The address of the set command.
     * @type {number | null | undefined}
     */
    address;

    /**
     * The length of the set command.
     * @type {number | null | undefined}
     */
    length;

    /**
     * The size of the set command.
     * @type {number | null | undefined}
     */
    size;

    /**
     * The bits associated with the set command.
     * @type {string | null | undefined}
     */
    bits;

    /**
     * The reference associated with the set command.
     * @type {string | null | undefined}
     */
    reference;

    /**
     * The description of the set command.
     * @type {string | null | undefined}
     */
    description;

    /**
     * The value associated with the set command.
     * @type {* | null | undefined}
     */
    value;

    /**
     * The bytes associated with the set command.
     * @type {number[] | null | undefined}
     */
    bytes;

    /**
     * The frozen bytes associated with the set command.
     * @type {number[] | null | undefined}
     */
    bytesFrozen;

    /**
     * The read function associated with the set command.
     * @type {string | null | undefined}
     */
    readFunction;

    /**
     * The write function associated with the set command.
     * @type {string | null | undefined}
     */
    writeFunction;

    /**
     * The expression to evaluate after reading the value associated with the set command.
     * @type {string | null | undefined}
     */
    afterReadValueExpression;

    /**
     * The function to execute after reading the value associated with the set command.
     * @type {string | null | undefined}
     */
    afterReadValueFunction;

    /**
     * The function to execute before writing the value associated with the set command.
     * @type {string | null | undefined}
     */
    beforeWriteValueFunction;
}

/**
 * Represents a dictionary of properties where keys are strings and values are of type IMapperProperty.
 * @typedef {Object.<string, IMapperProperty>} PropertiesDictionary
 */

/**
 * Represents a mapper with a collection of properties.
 * @interface
 */
class IMapper {
    /**
     * The dictionary of properties associated with the mapper.
     * @type {PropertiesDictionary}
     */
    properties;
}

/**
 * These variables are dynamically assigned and their types are unknown at compile time.
 * @type {any}
 */
export const variables = __variables;

/**
 * These variables are dynamically assigned and their types are unknown at compile time.
 * @type {any}
 */
export const state = __state;

/**
 * Represents an instance of a memory object.
 * @type {IMemory}
 */
export const memory = __memory;

/**
 * Represents an instance of a mapper object.
 * @type {IMapper}
 */
export const mapper = __mapper;

/**
 * Represents an instance of a console object.
 * @type {IConsole}
 */
export const console = __console;

/**
 * Gets the value of the property.
 * @param {string} path - The path of the property.
 */
export function getValue(path) {
    const property = mapper.properties[path]

    if (!property) {
        throw new Error(`${path} is not defined in properties.`)
    }

    return property.value;
}

/**
 * Sets the value of the property.
 * @param {string} path - The path of the property.
 * @param {any} value - The value to write.
 */
export function setValue(path, value) {
    const property = mapper.properties[path]

    if (!property) {
        throw new Error(`${path} is not defined in properties.`)
    }

    property.value = value
}

/**
 * Gets the property.
 * @param {string} path - The path of the property.
 */
export function getProperty(path) {
    const property = mapper.properties[path]

    if (!property) {
        throw new Error(`${path} is not defined in properties.`)
    }

    return property;
}

/**
 * Sets multiple attributes of the property.
 * @param {string} path - The path of the property.
 * @param {IMapperSetCommand} values - The attributes to set.
 */
export function setProperty(path, values) {
    const property = getProperty(path)

    if (values.memoryContainer !== undefined) property.memoryContainer = values.memoryContainer
    if (values.address !== undefined) property.address = values.address
    if (values.length !== undefined) property.length = values.length
    if (values.size !== undefined) property.size = values.size
    if (values.bits !== undefined) property.bits = values.bits
    if (values.reference !== undefined) property.reference = values.reference
    if (values.value !== undefined) property.value = values.value
    if (values.bytes !== undefined) property.bytes = values.bytes
    if (values.readFunction !== undefined) property.readFunction = values.readFunction
    if (values.writeFunction !== undefined) property.writeFunction = values.writeFunction
    if (values.afterReadValueExpression !== undefined) property.afterReadValueExpression = values.afterReadValueExpression
    if (values.afterReadValueFunction !== undefined) property.afterReadValueFunction = values.afterReadValueFunction
    if (values.beforeWriteValueFunction !== undefined) property.beforeWriteValueFunction = values.beforeWriteValueFunction
}

/**
 * Recursively copies properties from source to destination.
 * @param {string} sourcePath - The source path.
 * @param {string} destinationPath - The destination path.
 */
export function copyProperties(sourcePath, destinationPath) {
    const sourceProps = Object.values(mapper.properties).filter(x => x.path.startsWith(sourcePath))
    const destinationProps = Object.values(mapper.properties).filter(x => x.path.startsWith(destinationPath))

    destinationProps.forEach(property => {
        const restOfThePath = property.path.replace(destinationPath, '')
        const source = sourceProps.find(x => x.path === `${sourcePath}${restOfThePath}`)

        if (source) {
            setProperty(property.path, source)
        }
    })
}
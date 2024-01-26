interface IConsole {
    log(message: string): void
    trace(message: string): void
    debug(message: string): void
    info(message: string): void
    warn(message: string): void
    error(message: string): void
}

interface IMemory {
    defaultNamespace: {
        get_uint16_le(memoryAddress: number): number
        get_uint16_be(memoryAddress: number): number
        get_uint32_le(memoryAddress: number): number
        get_uint32_be(memoryAddress: number): number
        get_uint64_le(memoryAddress: number): number
        get_uint64_be(memoryAddress: number): number

        get_byte(memoryAddress: number): number
        get_bytes(memoryAddress: number, length: number): IByteArray
    }

    fill(namespace: string, offset: number, data: number[]): void
}

interface IByteArray {
    [index: number]: number;

    data: number[]

    get_uint16_le(): number
    get_uint16_be(): number
    get_uint32_le(): number
    get_uint32_be(): number
    get_uint64_le(): number
    get_uint64_be(): number

    get_uint16_le(offset: number): number
    get_uint16_be(offset: number): number
    get_uint32_le(offset: number): number
    get_uint32_be(offset: number): number
    get_uint64_le(offset: number): number
    get_uint64_be(offset: number): number

    get_byte(memoryAddress: number): number
}

interface IMapperProperty {
    path: string
    address?: number | null
    value: any
}

interface IMapperSetCommand {
    address?: number | null
    value?: any | null
}

interface PropertiesDictionary {
    [key: string]: IMapperProperty;
}
interface IMapper {
    properties: PropertiesDictionary
}

// @ts-ignore
export const variables = __variables as any

// @ts-ignore
export const state = __state as any

// @ts-ignore
export const memory = __memory as IMemory

// @ts-ignore
export const mapper = __mapper as IMapper

// @ts-ignore
export const console = __console as IConsole

export function getValue<T>(path: string): T {
    // @ts-ignore
    const property = mapper.properties[path]

    if (!property) {
        throw new Error(`${path} is not defined in properties.`)
    }

    return property.value as T;
}

export function setValue(path: string, value: any) {
    // @ts-ignore
    const property = mapper.properties[path]

    if (!property) {
        throw new Error(`${path} is not defined in properties.`)
    }

    property.value = value
}

export function getProperty(path: string) {
    // @ts-ignore
    const property = mapper.properties[path]

    if (!property) {
        throw new Error(`${path} is not defined in properties.`)
    }

    return property;
}

export function setProperty(path: string, values: IMapperSetCommand) {
    const property = getProperty(path)

    if (values.address !== undefined)   property.address = values.address
    if (values.value !== undefined)     property.value = values.value
}

export function copyProperties(sourcePath: string, destinationPath: string) {
    const sourceProps = Object.values(mapper.properties).filter(x => x.path.startsWith(sourcePath))
    const destinationProps = Object.values(mapper.properties).filter(x => x.path.startsWith(destinationPath))

    destinationProps.forEach(property => {
        const restOfThePath = property.path.replace(destinationPath, '')

        const source = sourceProps.find(x => x.path === `${sourcePath}${restOfThePath}`)
        if (source) {
            setProperty(property.path, { address: source.address, value: source.value })
        }
    })
}

export function BitRange(value: number, upperBounds: number, lowerBounds: number): number {
    // Validate the input bounds
    if (lowerBounds < 0 || upperBounds >= 32 || lowerBounds > upperBounds) {
        throw new Error('Invalid bounds');
    }

    // Shift the value to the right by lowerBounds
    let shiftedValue = value >>> lowerBounds;

    // Create a mask for the upper bounds
    let mask = (1 << (upperBounds - lowerBounds + 1)) - 1;

    // Apply the mask to get the bit range
    return shiftedValue & mask;
}
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
    memoryContainer?: string | null
    address?: number | null
    length?: number | null
    size?: number | null
    bits?: string | null
    reference?: string | null
    value?: any
    bytes?: number[] | null
}

interface IMapperSetCommand {
    memoryContainer?: string | null
    address?: number | null
    length?: number | null
    size?: number | null
    bits?: string | null
    reference?: string | null
    value?: any | null
    bytes?: number[] | null
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

    if (values.memoryContainer !== undefined) property.memoryContainer = values.memoryContainer
    if (values.address !== undefined) property.address = values.address
    if (values.length !== undefined) property.length = values.length
    if (values.size !== undefined) property.size = values.size
    if (values.bits !== undefined) property.bits = values.bits
    if (values.reference !== undefined) property.reference = values.reference
    if (values.bytes !== undefined) property.bytes = values.bytes
    if (values.value !== undefined) property.value = values.value
}

export function copyProperties(sourcePath: string, destinationPath: string) {
    const sourceProps = Object.values(mapper.properties).filter(x => x.path.startsWith(sourcePath))
    const destinationProps = Object.values(mapper.properties).filter(x => x.path.startsWith(destinationPath))

    destinationProps.forEach(property => {
        const restOfThePath = property.path.replace(destinationPath, '')

        const source = sourceProps.find(x => x.path === `${sourcePath}${restOfThePath}`)
        if (source) {
            setProperty(property.path, {
                memoryContainer: source.memoryContainer,
                address: source.address,
                length: source.length,
                size: source.size,
                bits: source.bits,
                reference: source.reference,
                value: source.value
            })
        }
    })
}
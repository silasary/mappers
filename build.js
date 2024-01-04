import fsExtra from 'fs-extra'
import path from 'path'

import { glob } from "glob"
import globWatcher from 'glob-watcher'

import { rollup } from 'rollup'
import typescript from '@rollup/plugin-typescript'

const { exists, remove, ensureDir, copyFile } = fsExtra
const { join } = path

const xmlGlob = '{DEPRECATED,GB,GBA,GBC,N64,NDS,NES,PSX,SNES}/*.xml'
const tsGlob = '{DEPRECATED,GB,GBA,GBC,N64,NDS,NES,PSX,SNES}/*.ts'

async function parallelForEach(array, callback) { await Promise.all(array.map(callback)) }

async function processXml(file) {
    const destPath = path.join('dist', file)

    await ensureDir(path.dirname(destPath))
    await copyFile(file, destPath)

    console.info(`Processed ${file}`)
}

async function processTs(file) {
    const bundle = await rollup({
        input: file,
        plugins: [
            typescript({ inlineSources: true })
        ],
    })

    await bundle.write({
        file: join('dist', file.replace('.ts', '.js')),
        format: 'es',
        strict: true
    })

    await bundle.close()

    console.info(`Processed ${file}`)
}

if (process.argv.includes('--watch')) {
    const xmlWatcher = globWatcher(xmlGlob);
    xmlWatcher.on('change', async function (path) { await processXml(path) })
    xmlWatcher.on('add', async function (path) { await processXml(path) })
    xmlWatcher.on('unlink', function (path) { remove(join('dist', path)) })
    xmlWatcher.on('error', function (error) { console.error(error); process.exit(1) })

    const tsWatcher = globWatcher(tsGlob);
    tsWatcher.on('change', async function (path) { await processTs(path) })
    tsWatcher.on('add', async function (path) { await processTs(path) })
    tsWatcher.on('unlink', function (path) { remove(join('dist', path.replace('.ts', '.js'))) })
    tsWatcher.on('error', function (error) { console.error(error); process.exit(1) })

    console.info('Watching for files changes.')
} else {
    await remove('dist')
    await ensureDir('dist')

    await parallelForEach(glob.sync(xmlGlob), async (file) => {
        await processXml(file)

        const tsFile = file.replace('.xml', '.ts')
        if (await exists(tsFile)) { await processTs(tsFile) }
    })
    
    console.info('Build complete.')
}
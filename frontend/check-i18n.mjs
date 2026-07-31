#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const i18nDir = resolve(dirname(fileURLToPath(import.meta.url)), 'src/i18n')

const readFile = (filePath) => readFileSync(resolve(i18nDir, filePath), 'utf8')

const extractObjectLiteral = (source, startMarker, endMarker) => {
  const start = source.indexOf(startMarker) + startMarker.length
  const end = source.lastIndexOf(endMarker)
  return Function(`return (${source.slice(start, end + 1)})`)()
}

const getRegistryKeys = () => {
  const source = readFile('message-registry.ts')
  const registry = extractObjectLiteral(source, 'MESSAGE_REGISTRY =', '} as const')
  const keys = []
  for (const [namespace, messages] of Object.entries(registry)) {
    for (const key of Object.keys(messages)) {
      keys.push(`${namespace}.${key}`)
    }
  }
  return keys
}

const getLocaleKeys = (fileName) => {
  const source = readFile(`locales/source/${fileName}`)
  const messages = extractObjectLiteral(source, '= ', '}')
  return Object.keys(messages)
}

const registryKeys = getRegistryKeys()
const registryKeySet = new Set(registryKeys)

const localeKeys = getLocaleKeys('zhTW.ts')
const localeKeySet = new Set(localeKeys)
const missing = registryKeys.filter((key) => !localeKeySet.has(key))
const stale = localeKeys.filter((key) => !registryKeySet.has(key))

console.log(`message-registry keys: ${registryKeys.length}`)
console.log(`zh-TW keys: ${localeKeys.length}`)

for (const key of missing) console.log(`  [missing] ${key}`)
for (const key of stale) console.log(`  [stale]   ${key}`)

if (missing.length > 0 || stale.length > 0) {
  console.error(`zh-TW is incomplete: missing ${missing.length}, stale ${stale.length}`)
  process.exit(1)
}
console.log('zh-TW is complete.')

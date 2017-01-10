const fs = require('fs')
const crypto = require('crypto')
const sodium = require('sodium-prebuilt')
const _ = require('lodash')

const envVars = {}

const generateSecret = (secret, name) => {
  return crypto.createHmac('sha256', secret).update(name).digest('base64')
}

const getVar = (name, def = false) => {
  return process.env[name] || envVars[name] || def
}

// get env vars from the env file
try {
  const file = process.env.NODE_ENV === 'test' ? 'test.env.list' : 'env.list'

  const envFile = fs.readFileSync(file)
  const fileLines = envFile.toString().split('\n')

  fileLines.forEach((line) => {
    if (!line) return

    const keyPairArray = line.split('=')

    envVars[keyPairArray[0]] = keyPairArray.slice(1).join('=')
  })
} catch (err) {
  // Both env.list and environment variables are missing
  if (!process.env.API_DB_URI && !process.env.DB_URI) {
    console.log('DB_URI is not set. Did you configure ilp-kit? \n'
      + 'To configure ilp-kit, run: npm run configure')

    process.exit()
  }
}

// make sure versioning matches between file and this kit
const ILP_KIT_CLI_SUPPORTED_VERSION = '10.1.0'

const supportedVersion = ILP_KIT_CLI_SUPPORTED_VERSION.split('.')
const version = (envVars.ILP_KIT_CLI_VERSION || '0.0.0').split('.')

for (let i = 0; i < version.length; ++i) {
  const v = +version[i], sv = +supportedVersion[i]
  if (v > sv) {
    break
  } else if (v < sv) {
    console.log('`env.list` version (' + envVars.ILP_KIT_CLI_VERSION
      + ') is older than supported version (' + ILP_KIT_CLI_SUPPORTED_VERSION
      + '). Back up your env.list and run `npm run configure` to update.')
    process.exit()
  }
}

// backwards compatibility
if (!envVars.DB_URI) {
  envVars.DB_URI = envVars.API_DB_URI
}

// Add API env vars
if (!envVars.API_DB_URI) {
  envVars.API_DB_URI = getVar('DB_URI')
}

// Secrets
const secret = getVar('API_SECRET', 'secret') // 'secret' for tests
envVars.API_ED25519_SECRET_KEY = generateSecret(secret, 'API_ED25519')
envVars.CONNECTOR_ED25519_SECRET_KEY = generateSecret(secret, 'CONNECTOR_ED25519')

// Add ledger env vars
if (!getVar('API_LEDGER_URI')) {
  const clientPublicPort = getVar('CLIENT_PUBLIC_PORT') || getVar('CLIENT_PORT', '80')
  const ledgerPublicPort = (clientPublicPort !== '80' && clientPublicPort !== '443') ? ':' + clientPublicPort : ''

  envVars.LEDGER_DB_URI = getVar('LEDGER_DB_URI') || getVar('DB_URI')
  envVars.LEDGER_HOSTNAME = getVar('LEDGER_HOSTNAME') || getVar('API_HOSTNAME', 'localhost')
  envVars.LEDGER_PORT = getVar('LEDGER_PORT') || Number(getVar('API_PORT')) + 1
  envVars.LEDGER_PUBLIC_PORT = getVar('LEDGER_PUBLIC_PORT', clientPublicPort)
  envVars.LEDGER_PUBLIC_PATH = getVar('LEDGER_PUBLIC_PATH', 'ledger')
  envVars.LEDGER_PUBLIC_HTTPS = getVar('LEDGER_PUBLIC_HTTPS') || getVar('API_PUBLIC_HTTPS')
  envVars.API_LEDGER_ADMIN_USER = getVar('LEDGER_ADMIN_USER') || getVar('LEDGER_ADMIN_USER', 'admin')
  envVars.API_LEDGER_ADMIN_PASS = getVar('LEDGER_ADMIN_PASS') || getVar('LEDGER_ADMIN_PASS', 'admin')
  envVars.LEDGER_SECRET = generateSecret(secret, 'LEDGER_SECRET')
  envVars.LEDGER_ENABLE = true

  const protocol = getVar('API_PUBLIC_HTTPS') ? 'https:' : 'http:'

  envVars.API_LEDGER_URI = 'http://' + (getVar('API_PRIVATE_HOSTNAME') || getVar('LEDGER_HOSTNAME')) + ':' + getVar('LEDGER_PORT')
  envVars.API_LEDGER_PUBLIC_URI = protocol + '//' + getVar('LEDGER_HOSTNAME') + ledgerPublicPort + '/' + getVar('LEDGER_PUBLIC_PATH')
}

// Set envVars in environment
_.each(envVars, (envVar, index) => {
  if (!process.env[index]) process.env[index] = envVar
})

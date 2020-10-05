require('dotenv').config()

const { Client } = require('discord.js')

const { TOKEN } = process.env

async function bootstrap() {
  const client = new Client()
  try {
    await client.login(TOKEN)
    console.info('Logged in succesfully.')
  } catch (e) {
    console.error('Something went wrong while logging in.')
    throw e
  }

  require('./listener')({ client })
}

bootstrap()

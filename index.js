require('dotenv').config()

const { Client } = require('discord.js')

const { DISCORD_TOKEN } = process.env

async function bootstrap() {
  const client = new Client()
  try {
    await client.login(DISCORD_TOKEN)
    console.info('Logged in succesfully.')
  } catch (e) {
    console.error('Something went wrong while logging in.')
    throw e
  }
}

bootstrap()

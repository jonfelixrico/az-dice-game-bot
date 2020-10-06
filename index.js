require('dotenv').config()

const { Client } = require('discord.js')
const { TOKEN } = process.env

async function bootstrap() {
  const client = new Client()

  await client.login(TOKEN)
  console.info('Logged in succesfully.')
  // the program is expected to terminate if an error was encountered while connecting to discord

  const services = await require('./services')()
  console.info('Initialized services.')

  require('./controllers')({
    client,
    // inject whatever you want here. services maybe?
    ...services,
  })
  console.info('Initialized controllers.')
}

bootstrap()

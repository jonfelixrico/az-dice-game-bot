require('dotenv-defaults').config()

const { Client } = require('discord.js')
const { TOKEN } = process.env

async function bootstrap() {
  const client = new Client()

  await client.login(TOKEN)
  console.info('Logged in succesfully.')
  // the program is expected to terminate if an error was encountered while connecting to discord

  const repos = await require('./repositories')({ client })
  console.info('Initialized repositories.')

  const services = await require('./services')({ client, ...repos })
  console.info('Initialized services.')

  const interactors = await require('./interactors')({
    client,
    ...repos,
    ...services,
  })
  console.info('Initialized interactors.')

  require('./controllers')({
    client,
    // inject whatever you want here. services maybe?
    ...services,
    ...interactors,
    ...repos,
  })
  console.info('Initialized controllers.')
}

bootstrap()

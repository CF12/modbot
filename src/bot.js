/*
███    ███  ██████  ██████  ██████   ██████  ████████
████  ████ ██    ██ ██   ██ ██   ██ ██    ██    ██
██ ████ ██ ██    ██ ██   ██ ██████  ██    ██    ██
██  ██  ██ ██    ██ ██   ██ ██   ██ ██    ██    ██
██      ██  ██████  ██████  ██████   ██████     ██
*/
// - A discord moderation bot
// - Built on discord.js v11.0
// - By: CF12

// Test for DiscordJS
try { require.resolve('discord.js') } catch (err) { console.error('Discord.JS not found. Please make sure that you\'ve installed all the dependencies using \'npm init\'.') }

// Dependencies
const DiscordJS = require('discord.js')
const logger = require('./logger.js')
const fs = require('fs')
const path = require('path')
const os = require('os')

// Load Config Files
try {
  var config = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'config.json'), 'utf8'))
  var commands = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'res', 'commands.json'), 'utf8'))
} catch (err) {
  if (err) throw Error('Configuration / Data files appear to be missing / corrupt. Please double check the configs.')
}

// Variables
let pf = config.prefix
let cache = {
  active_warning: false,
  user_cache: {}
}
let userCache = cache.user_cache

// Constructions
let bot = new DiscordJS.Client()

// Functions
function pfCommand (command) { return String(pf + command) }

// Event: On Ready
bot.on('ready', () => {
  logger.logConsole('info', 'Bot is now online')
  bot.user.setGame('DEV - By CF12')
})

// Event: On Message
bot.on('message', (msg) => {
  // If author is a bot, cancels interactions
  if (msg.author.bot) return

  // Variable Shortcuts - General
  let msgContent = msg.content
  let msgUser = msg.author
  let msgMember = msg.member
  let msgChannel = msg.channel
  let msgArray = msgContent.split(' ')
  let msgCommand = msgArray[0].slice(pf.length).toUpperCase()
  let msgArgs = msgArray.slice(1, msgArray.length)

  // Caches members if they don't exist in the cache yet
  if (!(msgMember.id in userCache)) {
    userCache[msgMember.id] = {
      username: msgUser.username,
      identifier: msgUser.toString(),
      last_msg_timestamp: 0
    }
  }

  // Spam Protection
  if (msg.createdTimestamp - userCache[msgMember.id].last_msg_timestamp <= 500) {
    console.log('test')
    if (config.whitelist.includes(msgMember.id)) return

    msg.delete()
    if (!cache.active_warning) {
      cache.active_warning = logger.logChannel(msgChannel, 'spam', 'Please don\'t spam, ' + userCache[msgMember.id].identifier)
        .then((msg) => {
          setTimeout(() => {
            cache.active_warning = false
            msg.delete()
          }, 5000)
        })
    }
    return
  }

  // Updates last message timestamp for user
  userCache[msgMember.id].last_msg_timestamp = msg.createdTimestamp

  // Command Handler
  if (msg.content.startsWith(pf)) {
    // Command: Help
    if (msgCommand === 'HELP') {
      let helpMsg = '**                                           MODBOT >> Help Page **\n**==================================================**\n'
      for (let command of commands) helpMsg += '**' + pfCommand(command.command) + '**' + ' - ' + command.short_desc + '\n'

      logger.logChannel(msgChannel, 'plain', helpMsg)
      return
    }

    // Command: Status
    if (msgCommand === 'STATUS') {
      let memoryStats = process.memoryUsage()
      logger.logChannel(msgChannel, 'mdcode', `
STATUS:       Online
UPTIME:       ${Math.ceil(bot.uptime * 0.001)} seconds
CPU USAGE:    ${os.loadavg()[2]}%
MEMORY USAGE: ${Math.ceil(memoryStats.heapUsed / 1048576)} / ${Math.ceil(memoryStats.heapTotal / 1048576)} MB`)
      return
    }

    // Command: Info
    if (msgCommand === 'INFO') {
      logger.logChannel(msgChannel, 'code',
        '                         __  __  ____  _____  ____   ____ _______\n' +
        '                        |  \\/  |/ __ \\|  __ \\|  _ \\ / __ \\__   __|\n' +
        '                        | \\  / | |  | | |  | | |_) | |  | | | |\n' +
        '                        | |\\/| | |  | | |  | |  _ <| |  | | | |\n' +
        '                        | |  | | |__| | |__| | |_) | |__| | | |\n' +
        '                        |_|  |_|\\____/|_____/|____/ \\____/  |_|\n' +
        '             ==============================================================\n' +
        '                                 -= EZ BOT, EZ LIFE =-  \n' +
        '                                  DEVELOPED BY: CF12     '
      )
      return
    }

    // Command: Debug
    if (msgCommand === 'DEBUG') {
      return
    }

    // Command: Purge
    if (msgCommand === 'PURGE') {
      // Checks for MANAGE_MESSAGES permission
      if (!msgMember.hasPermission('MANAGE_MESSAGES')) return logger.logChannel(msgChannel, 'noperm', 'You need the **MANAGE_MESSAGES** permission in order to use this command.')

      // Checks for proper args
      if (msgArgs.length > 1 || (msgArgs[0] > 100 || msgArgs[0] < 1)) return logger.logChannel(msgChannel, 'err', 'Invalid Usage! Proper Usage: **' + pfCommand('purge') + ' [1 - 100]**')

      // Deletes current msg
      msg.delete()

      // Purges the messages
      msgChannel.bulkDelete(parseInt(msgArgs[0]) + 1)
      .then(() => {
        logger.logConsole('info', 'Successfully purged ' + msgArgs[0] + ' messages from channel [' + msgChannel.name + ']')
        logger.logChannel(msgChannel, 'info', 'Successfully purged **' + msgArgs[0] + '** message(s)')
        .then(msg => {
          setTimeout(() => {
            msg.delete().then(() => { return }, () => { return })
          }, 5000)
        })
      })
      return
    }

    return logger.logChannel(msgChannel, 'err', 'Invalid command. Please use **' + pfCommand('help') + ' **to get a complete list of commands.')
  }
})

// Logs the bot in
bot.login(config.bot_token)

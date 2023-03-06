const Discord = require('discord.js');
const client = new Discord.Client();

const BOT_TOKEN = 'YOUR_BOT_TOKEN';

// Map to store the number of actions a user has taken
const cooldowns = new Map();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageDelete', async message => {
  // Ignore messages from bots
  if (message.author.bot) return;

  // Log the deleted message
  const logChannel = message.guild.channels.cache.find(channel => channel.name === 'log-channel');
  if (logChannel) {
    const embed = new Discord.MessageEmbed()
      .setTitle('Message Deleted')
      .setDescription(`**Message sent by ${message.author} was deleted in ${message.channel}\n\nContent: ${message.content}**`)
      .setColor('#FF0000')
      .setTimestamp();
    logChannel.send(embed);
  }

  // Check if the user has exceeded the message delete rate limit
  const now = Date.now();
  const userCooldown = cooldowns.get(message.author.id);
  if (userCooldown && (now - userCooldown) < 5000) {
    // The user has exceeded the rate limit, take action
    const member = message.guild.members.cache.get(message.author.id);
    if (member) {
      // Mute the user
      const muteRole = message.guild.roles.cache.find(role => role.name === 'Muted');
      if (muteRole) {
        member.roles.add(muteRole);
        logChannel.send(`${member} has been muted for message deletion spam.`);
      }
    }
  } else {
    // The user has not exceeded the rate limit, log the deleted message and update the cooldown
    cooldowns.set(message.author.id, now);
  }
});

client.on('guildBanAdd', async (guild, user) => {
  // Ignore bans issued by bots
  if (user.bot) return;

  // Log the banned user
  const logChannel = guild.channels.cache.find(channel => channel.name === 'log-channel');
  if (logChannel) {
    const embed = new Discord.MessageEmbed()
      .setTitle('Member Banned')
      .setDescription(`**${user} was banned from the server**`)
      .setColor('#FF0000')
      .setTimestamp();
    logChannel.send(embed);
  }

  // Check if the user has exceeded the ban rate limit
  const now = Date.now();
  const userCooldown = cooldowns.get(user.id);
  if (userCooldown && (now - userCooldown) < 30000) {
    // The user has exceeded the rate limit, take action
    const member = guild.members.cache.get(user.id);
    if (member) {
      // Kick the user
      member.kick();
      logChannel.send(`${member} has been kicked for ban spam.`);
    }
  } else {
    // The user has not exceeded the rate limit, update the cooldown
    cooldowns.set(user.id, now);
  }
});

client.login(BOT_TOKEN);

const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../../models/User');
const Configuration = require('../../models/Configuration');
const client = require('../../bot/client');
const logger = require('../../utils/logger');

const router = express.Router();

// Redirect route to start Discord OAuth2
router.get('/login', (req, res) => {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = encodeURIComponent(process.env.DISCORD_REDIRECT_URI);
  const scopes = 'identify guilds.join';
  
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${encodeURIComponent(scopes)}`;
  res.redirect(discordAuthUrl);
});

// OAuth2 Callback
router.get('/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Authorization code missing.');
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_REDIRECT_URI;
  const guildId = process.env.GUILD_ID;
  
  try {
    // 1. Exchange OAuth2 Code for Access Token
    const tokenResponse = await axios.post(
      'https://discord.com/api/v10/oauth2/token',
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token, expires_in } = tokenResponse.data;

    // 2. Fetch User Profile from Discord API
    const userResponse = await axios.get('https://discord.com/api/v10/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const discordUser = userResponse.data;
    
    // 3. Verify member exists in target server and determine admin status
    let isAdmin = false;
    let isStaff = false;
    
    const guild = client.guilds.cache.get(guildId);
    if (guild) {
      try {
        const member = await guild.members.fetch(discordUser.id);
        if (member) {
          isAdmin = member.permissions.has('Administrator');
          
          // Check for staff role
          const config = await Configuration.findOne({ guildId }) || new Configuration({ guildId });
          const staffRoleId = config.staffRole || process.env.STAFF_ROLE_ID;
          
          if (staffRoleId && member.roles.cache.has(staffRoleId)) {
            isStaff = true;
          }
        }
      } catch (err) {
        logger.debug(`User is not in the guild or failed to fetch member: ${err.message}`);
      }
    }

    // Save or update User in MongoDB
    let userProfile = await User.findOne({ discordId: discordUser.id });
    if (!userProfile) {
      userProfile = new User({
        discordId: discordUser.id,
        username: discordUser.username,
        avatar: discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : null
      });
    } else {
      userProfile.username = discordUser.username;
      if (discordUser.avatar) {
        userProfile.avatar = `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`;
      }
    }
    await userProfile.save();

    // 4. Generate Session JWT
    const tokenPayload = {
      userId: discordUser.id,
      username: discordUser.username,
      avatar: userProfile.avatar,
      isAdmin: isAdmin || isStaff, // Admins and staff have panel access
      isStaff: isStaff
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'super_secret_jwt_token_key_change_me_in_production',
      { expiresIn: '7d' }
    );

    // 5. Redirect back to frontend dashboard
    const frontendUrl = process.env.WEBSITE_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard?token=${token}`);
  } catch (error) {
    logger.error('OAuth2 authentication failure:', error.response?.data || error.message);
    res.status(500).send('OAuth2 authentication failure. Please check server logs.');
  }
});

module.exports = router;

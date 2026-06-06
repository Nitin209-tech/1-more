const express = require('express');
const { EmbedBuilder } = require('discord.js');
const Claim = require('../../models/Claim');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { emitToUser } = require('./notifications');
const client = require('../../bot/client');
const logger = require('../../utils/logger');
const { getEmoji } = require('../../bot/utils/emojis');

const router = express.Router();

// Get claim details and status
router.get('/status/:claimId', authenticateToken, async (req, res) => {
  const { claimId } = req.params;
  const { userId } = req.user;
  
  try {
    const claim = await Claim.findOne({ claimId });
    if (!claim) {
      return res.status(404).json({ error: 'Claim session not found' });
    }
    
    // Authorization check
    if (claim.discordId !== userId && !req.user.isAdmin) {
      return res.status(403).json({ error: 'Forbidden: Access denied.' });
    }
    
    res.json(claim);
  } catch (error) {
    logger.error(`Error loading claim status ${claimId}:`, error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit Multi-Step Survey Verification Flow
router.post('/submit-survey/:claimId', authenticateToken, async (req, res) => {
  const { claimId } = req.params;
  const { userId } = req.user;
  const { basicInfo, verificationQuestions, termsAccepted } = req.body;
  
  try {
    const claim = await Claim.findOne({ claimId });
    if (!claim) {
      return res.status(404).json({ error: 'Claim session not found.' });
    }
    
    if (claim.discordId !== userId) {
      return res.status(403).json({ error: 'Forbidden: Access denied.' });
    }
    
    // Save survey data
    claim.surveyData = {
      basicInfo: new Map(Object.entries(basicInfo || {})),
      verificationQuestions: new Map(Object.entries(verificationQuestions || {})),
      termsAccepted: !!termsAccepted
    };
    
    claim.status = 'Processing'; // Move to processing stage
    await claim.save();
    
    // Notify Discord ticket channel
    if (claim.channelId) {
      const guildId = process.env.GUILD_ID;
      const guild = client.guilds.cache.get(guildId);
      if (guild) {
        const channel = guild.channels.cache.get(claim.channelId);
        if (channel) {
          const verifyEmoji = await getEmoji(guildId, 'verify');
          const successEmoji = await getEmoji(guildId, 'success');
          
          const embed = new EmbedBuilder()
            .setTitle(`${verifyEmoji} Web Survey Submitted`)
            .setColor(0xFFAA00)
            .setDescription(`User <@${userId}> has successfully completed the web survey. The claim is now ready for staff review!`)
            .addFields(
              { name: 'Full Name', value: basicInfo?.fullName || 'Not provided', inline: true },
              { name: 'Discord Tag', value: basicInfo?.discordTag || 'Not provided', inline: true },
              { name: 'Roblox Username', value: basicInfo?.robloxUsername || 'Not provided', inline: true },
              { name: 'Terms Accepted?', value: termsAccepted ? `${successEmoji} Yes` : `${verifyEmoji} No`, inline: true }
            )
            .setTimestamp();
            
          await channel.send({ embeds: [embed] });
        }
      }
    }
    
    // Emit real-time SSE notification to the user's browser tab
    emitToUser(userId, {
      type: 'SURVEY_SUBMITTED',
      title: 'Survey Received!',
      message: `Your verification form for **${claim.rewardName}** has been submitted. Staff will review it shortly.`,
      claimId: claim.claimId,
      rewardName: claim.rewardName,
      status: 'Processing'
    });
    
    res.json({ message: 'Survey verification submitted successfully.', status: claim.status });
  } catch (error) {
    logger.error('Error submitting survey verification:', error);
    res.status(500).json({ error: 'Failed to process survey submission.' });
  }
});

module.exports = router;

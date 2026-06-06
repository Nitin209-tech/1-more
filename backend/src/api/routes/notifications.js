const express = require('express');
const { authenticateToken } = require('../middlewares/authMiddleware');
const logger = require('../../utils/logger');

const router = express.Router();

/**
 * Global Map of active SSE connections.
 * Key: userId (Discord ID), Value: Array of SSE response objects
 */
const sseClients = new Map();

/**
 * Register this user's SSE connection.
 * GET /api/notifications/stream
 */
router.get('/stream', authenticateToken, (req, res) => {
  const { userId } = req.user;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Send initial heartbeat to establish connection
  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'SSE connected', userId })}\n\n`);

  // Register client in map
  const existing = sseClients.get(userId) || [];
  existing.push(res);
  sseClients.set(userId, existing);
  logger.info(`SSE connection opened for userId: ${userId} (total connections: ${existing.length})`);

  // Heartbeat every 20s to keep connection alive
  const heartbeat = setInterval(() => {
    res.write(`event: heartbeat\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);
  }, 20000);

  // Cleanup on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    const connections = sseClients.get(userId) || [];
    const filtered = connections.filter(c => c !== res);
    if (filtered.length === 0) {
      sseClients.delete(userId);
    } else {
      sseClients.set(userId, filtered);
    }
    logger.info(`SSE connection closed for userId: ${userId}`);
  });
});

/**
 * Emit a notification event to a specific user by Discord ID.
 * @param {string} userId - Discord user ID
 * @param {object} payload - Notification data: { type, title, message, status }
 */
const emitToUser = (userId, payload) => {
  const connections = sseClients.get(userId);
  if (!connections || connections.length === 0) {
    logger.debug(`No active SSE connections for userId: ${userId}`);
    return;
  }

  const data = JSON.stringify({
    id: `notif-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...payload
  });

  connections.forEach(res => {
    try {
      res.write(`event: notification\ndata: ${data}\n\n`);
    } catch (err) {
      logger.error(`Failed to write SSE to userId ${userId}:`, err.message);
    }
  });

  logger.debug(`SSE notification emitted to userId: ${userId} | type: ${payload.type}`);
};

module.exports = { router, emitToUser };

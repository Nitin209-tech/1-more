const jwt = require('jsonwebtoken');
const logger = require('../../utils/logger');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Fallback to query param for EventSource (SSE) which cannot set headers
  const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please log in.' });
  }
  
  try {
    const secret = process.env.JWT_SECRET || 'super_secret_jwt_token_key_change_me_in_production';
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // Contains userId, claimId, rewardName, and potential admin flag
    next();
  } catch (error) {
    logger.warn('Invalid JWT attempt:', error.message);
    return res.status(403).json({ error: 'Session expired or invalid token. Please authenticate via Discord.' });
  }
};

module.exports = { authenticateToken };

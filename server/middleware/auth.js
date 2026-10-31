/**
 * Authentication & Role-Based Authorization Middleware
 * Supports standard JWT token signing/verification and
 * quick simulation headers for seamless Hackathon judging/demoing.
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'brightloop_hackathon_jwt_secret_key_2026';

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      customerId: user.customerId || null
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const verifyAuth = (req, res, next) => {
  // Check Authorization header: Bearer <token> or X-Simulated-Role header for rapid demo
  const authHeader = req.headers.authorization;
  const simRole = req.headers['x-simulated-role'];
  const simCustomerId = req.headers['x-simulated-customer-id'];

  // 1. Rapid simulation override if passed from frontend role-switcher
  if (simRole) {
    req.user = {
      id: 'sim_user_' + simRole,
      email: `${simRole}@brightloop.com`,
      name: `Simulated ${simRole.toUpperCase()}`,
      role: simRole,
      customerId: simCustomerId || null
    };
    return next();
  }

  // 2. Standard Bearer JWT verification
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized. User session missing.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Action requires [${allowedRoles.join(' or ')}] permission. Your role is '${req.user.role}'.`
      });
    }
    next();
  };
};

module.exports = {
  generateToken,
  verifyAuth,
  requireRole
};

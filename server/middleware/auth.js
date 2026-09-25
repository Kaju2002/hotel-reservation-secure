const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-change-me-in-production';

function signToken(user) {
    return jwt.sign(
        {
            userID: user.userID,
            email: user.email,
            userType: user.userType,
        },
        JWT_SECRET,
        { expiresIn: '8h' }
    );
}

function requireAuth(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

// Restrict a route to specific user roles (use after requireAuth)
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.userType)) {
            return res.status(403).json({ message: 'Forbidden: insufficient permissions' });
        }
        next();
    };
}

module.exports = { signToken, requireAuth, requireRole, JWT_SECRET };



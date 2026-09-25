const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const SERVER_URL = process.env.SERVER_URL || `http://localhost:${process.env.PORT || 5000}`;

function getGoogleConfig() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        return null;
    }
    return {
        clientId,
        clientSecret,
        redirectUri: `${SERVER_URL}/api/auth/google/callback`,
    };
}

function getGitHubConfig() {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
        return null;
    }
    return {
        clientId,
        clientSecret,
        redirectUri: `${SERVER_URL}/api/auth/github/callback`,
    };
}

function redirectWithError(res, message) {
    const url = new URL(`${CLIENT_URL}/oauth/callback`);
    url.searchParams.set('error', message);
    return res.redirect(url.toString());
}

function redirectWithSuccess(res, token, user) {
    const url = new URL(`${CLIENT_URL}/oauth/callback`);
    url.searchParams.set('token', token);
    url.searchParams.set('user', JSON.stringify(user));
    return res.redirect(url.toString());
}

function toUserResponse(user) {
    return {
        _id: user._id,
        userID: user.userID,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        userType: user.userType,
        profilePic: user.profilePic,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

async function generateUserID() {
    let userID;
    let userExists;
    do {
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        userID = `U${randomNum}`;
        userExists = await User.findOne({ userID });
    } while (userExists);
    return userID;
}

async function findOrCreateOAuthUser({ email, firstName, lastName, username, profilePic }) {
    if (!email) {
        throw new Error('OAuth provider did not return an email address');
    }

    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
        return user;
    }

    const userID = await generateUserID();
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    const safeUsername =
        (username || email.split('@')[0] || `user_${userID}`).replace(/\s+/g, '_').slice(0, 40);

    user = await User.create({
        userID,
        firstName: firstName || 'OAuth',
        lastName: lastName || 'User',
        email: email.toLowerCase(),
        username: safeUsername,
        password: hashedPassword,
        userType: 'Customer',
        profilePic: profilePic || null,
    });

    return user;
}

// ---------- Google (OpenID Connect / OAuth 2.0) ----------

router.get('/google', (req, res) => {
    const config = getGoogleConfig();
    if (!config) {
        return res.status(500).json({
            message: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.',
        });
    }

    const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'online',
        prompt: 'select_account',
    });

    return res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get('/google/callback', async (req, res) => {
    try {
        const config = getGoogleConfig();
        if (!config) {
            return redirectWithError(res, 'Google OAuth is not configured');
        }

        const { code, error } = req.query;
        if (error) {
            return redirectWithError(res, String(error));
        }
        if (!code) {
            return redirectWithError(res, 'Missing authorization code from Google');
        }

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code: String(code),
                client_id: config.clientId,
                client_secret: config.clientSecret,
                redirect_uri: config.redirectUri,
                grant_type: 'authorization_code',
            }),
        });

        const tokenData = await tokenRes.json();
        if (!tokenRes.ok || !tokenData.access_token) {
            console.error('Google token error:', tokenData);
            return redirectWithError(res, 'Failed to exchange Google authorization code');
        }

        const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });
        const profile = await profileRes.json();
        if (!profileRes.ok || !profile.email) {
            console.error('Google profile error:', profile);
            return redirectWithError(res, 'Failed to load Google profile');
        }

        const user = await findOrCreateOAuthUser({
            email: profile.email,
            firstName: profile.given_name || profile.name?.split(' ')[0] || 'Google',
            lastName: profile.family_name || profile.name?.split(' ').slice(1).join(' ') || 'User',
            username: profile.email.split('@')[0],
            profilePic: profile.picture || null,
        });

        const userResponse = toUserResponse(user);
        const token = signToken(userResponse);
        return redirectWithSuccess(res, token, userResponse);
    } catch (err) {
        console.error('Google OAuth callback error:', err);
        return redirectWithError(res, 'Google sign-in failed');
    }
});

// ---------- GitHub OAuth ----------

router.get('/github', (req, res) => {
    const config = getGitHubConfig();
    if (!config) {
        return res.status(500).json({
            message: 'GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.',
        });
    }

    const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        scope: 'read:user user:email',
        allow_signup: 'true',
    });

    return res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
});

router.get('/github/callback', async (req, res) => {
    try {
        const config = getGitHubConfig();
        if (!config) {
            return redirectWithError(res, 'GitHub OAuth is not configured');
        }

        const { code, error } = req.query;
        if (error) {
            return redirectWithError(res, String(error));
        }
        if (!code) {
            return redirectWithError(res, 'Missing authorization code from GitHub');
        }

        const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                client_id: config.clientId,
                client_secret: config.clientSecret,
                code: String(code),
                redirect_uri: config.redirectUri,
            }),
        });

        const tokenData = await tokenRes.json();
        if (!tokenRes.ok || !tokenData.access_token) {
            console.error('GitHub token error:', tokenData);
            return redirectWithError(res, 'Failed to exchange GitHub authorization code');
        }

        const profileRes = await fetch('https://api.github.com/user', {
            headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                Accept: 'application/vnd.github+json',
                'User-Agent': 'ITP-Hotel-OAuth',
            },
        });
        const profile = await profileRes.json();
        if (!profileRes.ok) {
            console.error('GitHub profile error:', profile);
            return redirectWithError(res, 'Failed to load GitHub profile');
        }

        let email = profile.email;
        if (!email) {
            const emailsRes = await fetch('https://api.github.com/user/emails', {
                headers: {
                    Authorization: `Bearer ${tokenData.access_token}`,
                    Accept: 'application/vnd.github+json',
                    'User-Agent': 'ITP-Hotel-OAuth',
                },
            });
            const emails = await emailsRes.json();
            if (Array.isArray(emails)) {
                const primary = emails.find((e) => e.primary && e.verified) || emails.find((e) => e.verified);
                email = primary?.email || null;
            }
        }

        if (!email) {
            return redirectWithError(res, 'GitHub account has no public/verified email');
        }

        const nameParts = (profile.name || profile.login || 'GitHub User').split(' ');
        const user = await findOrCreateOAuthUser({
            email,
            firstName: nameParts[0] || 'GitHub',
            lastName: nameParts.slice(1).join(' ') || 'User',
            username: profile.login || email.split('@')[0],
            profilePic: profile.avatar_url || null,
        });

        const userResponse = toUserResponse(user);
        const token = signToken(userResponse);
        return redirectWithSuccess(res, token, userResponse);
    } catch (err) {
        console.error('GitHub OAuth callback error:', err);
        return redirectWithError(res, 'GitHub sign-in failed');
    }
});

// Optional: verify token / load current user
router.get('/me', requireAuth, async (req, res) => {
    try {
        const user = await User.findOne({ userID: req.user.userID }).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.json({ user: toUserResponse(user) });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

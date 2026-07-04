const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Authenticate with Google OAuth
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  const { credential, role } = req.body;

  if (!credential) {
    return res.status(400).json({ success: false, message: 'Authentication credential token is required' });
  }

  try {
    let email, name, picture;

    const isBypass = process.env.BYPASS_GOOGLE_AUTH === 'true';

    if (isBypass && credential.startsWith('mock_')) {
      // Mock Bypass for local tests/development: e.g. "mock_alice" -> "alice@gmail.com"
      const prefix = credential.replace('mock_', '');
      email = `${prefix}@gmail.com`;
      name = prefix.charAt(0).toUpperCase() + prefix.slice(1);
      picture = `https://api.dicebear.com/7.x/initials/svg?seed=${name}`;
      console.log(`[Auth Bypass] Verified mock account: ${email}`);
    } else {
      // Real Google token verification
      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        
        if (!payload.email_verified) {
          return res.status(400).json({ success: false, message: 'Google email is not verified by Google' });
        }

        email = payload.email;
        name = payload.name;
        picture = payload.picture || '';
      } catch (err) {
        console.error('Google ID token verification failed:', err);
        return res.status(400).json({ success: false, message: 'Invalid Google OAuth Token' });
      }
    }

    // Enforce verified Google email restriction
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Only verified Google accounts (@gmail.com) are eligible to register on Nexora.' 
      });
    }

    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      if (!role || !['student', 'mentor'].includes(role)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Role ("student" or "mentor") is required for registration of new users' 
        });
      }

      user = await User.create({
        name,
        email,
        picture,
        role,
      });
    }

    // Generate local JWT token
    const token = jwt.sign(
      { id: user._id }, 
      process.env.JWT_SECRET || 'super_secret_nexora_jwt_key_987654321', 
      { expiresIn: '30d' }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        role: user.role,
        subscribedMentors: user.subscribedMentors || [],
      },
      isNewUser,
    });

  } catch (error) {
    console.error('Authentication Controller Error:', error);
    res.status(500).json({ success: false, message: 'Server Authentication Error' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('subscribedMentors', 'name email picture');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  googleAuth,
  getMe,
};

const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('config');
const {body, validationResult} = require('express-validator');
const User = require('../../models/User');

// @route GET api/auth
// @desc Get user by token
// @access Public
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch(err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route Post api/auth
// @desc Authenticate user & get token
// @access Public
router.post('/', 
    [
        body('email', 'Please include a valid email').isEmail(),
        body('password', 'Please enter password').exists()
    ], 
    async (req, res) => {
    
        // Input Validation
        const errs = validationResult(req);
        if (!errs.isEmpty()) {
           return res.status(400).json({ errors: errs.array() });
        }

        const { email, password } = req.body;
        
        try {
            // See if user exists
            let user = await User.findOne({ email });
            
            if (!user) {
                return res.status(400).json({ errors: [{msg: 'Invalid credentials'}] });
            }

            // Check password
            const match = await bcrypt.compare(password, user.password);
            if (!match) {
                return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }]});
            }
            
            // Return jsonwebtoken
            const payload = {
                user: {
                    id: user.id
                }
            };

            jwt.sign(
                payload, 
                config.get('jwtSecret'),
                { expiresIn: 360000 }, 
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });
                });

        
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

module.exports = router;
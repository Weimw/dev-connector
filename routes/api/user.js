const express = require('express');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const config = require('config');
const User = require('../../models/User')

// @route POST api/users
// @desc Create user
// @access Public`
router.post('/', 
    [
        body('name', 'Name is required').not().isEmpty(),
        body('email','Please include a valid email').isEmail(),
        body('password', 
        'Please enter a password with 6 or more characters'
        ).isLength({ min: 6 })
    ], 
    async (req, res) => {
    
        // Input Validation
        const errs = validationResult(req);
        if (!errs.isEmpty()) {
           return res.status(400).json({ errors: errs.array() });
        }

        const { name, email, password } = req.body;
        
        try {
            // See if user exists
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ errors: [{msg: 'User already exists'}] });
            }
            
            // Get user gravatar
            const avatar = gravatar.url(email, {
                s: '200',
                r: 'pg',
                d: 'mm'
            });


            user = new User({
                name: name,
                email: email,
                avatar: avatar,
                password: password
            });

            // Encrypt password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            
            console.log(user);
            await user.save();
            
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
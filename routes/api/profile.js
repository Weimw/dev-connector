const express = require('express');
const request = require('request');
const config = require('config');
const router = express.Router();
const auth = require('../../middleware/auth');
const { body, validationResult } = require('express-validator'); 

const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route GET api/profile/me
// @desc Get current users profile
// @access Private
router.get('/me', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ 
            user: req.user.id 
        }).populate('user', ['name', 'avatar']);

        if (!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route GET api/profile
// @desc Get all profiles
// @access Public
router.get('/', async (req, res) => {
    try {
        const profiles = await Profile.find().populate('user', ['name', 'avatar']);
        res.json(profiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route GET api/profile/user:user_id
// @desc Get all profiles
// @access Public
router.get('/user/:user_id', async (req, res) => {
    try {
        const profile = await Profile.findOne({ 
            user: req.params.user_id
        }).populate('user', ['name', 'avatar']);
        
        if (!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }

        res.json(profile);
    } catch (err) {
        console.error(err.message);
        if (err.kind == 'ObjectId') {
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }
        res.status(500).send('Server Error');
    }
});

// @route GET api/profile/github/:username
// @desc Get user repos from Github
// @access Public
router.get('/github/:username', async (req, res) => {
    try {
        const options = {
            uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc&client_id=${config.get('githubClientID')}&client_sercet=${config.get('githubSecret')}`,
            method:'GET',
            headers: { 'user-agent': 'node.js' }
        }

        request(options, (error, response, body) => {
            if (error) console.error(error);
            if (response.statusCode != 200) {
                return res.status(404).json({ msg: 'No github profile found'});
            }
            res.json(JSON.parse(body));
        })
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route POST api/profile
// @desc Create or update current users profile
// @access Private
router.post(
    '/', 
    [
        auth,
        [
            body('status', 'Status is required').not().isEmpty(),
            body('skills', 'Skills are required').not().isEmpty()
        ]
    ], async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array()});
        }

        const {
            company,
            website,
            location,
            status,
            skills,
            bio,
            githubusername,
            youtube,
            twitter,
            instagram,
            linkedin,
            facebook,
            // spread the rest of the fields we don't need to check
            ...rest
        } = req.body;
          
        const profileFields = {};
        profileFields.user = req.user.id;
        if (company) profileFields.company = company;
        if (website) profileFields.website = website;
        if (location) profileFields.location = location;
        if (bio) profileFields.bio = bio;
        if (status) profileFields.status = status;
        if (githubusername) profileFields.githubusername = githubusername;
        if (skills) {
            profileFields.skills = skills.split(',').map(skill => skill.trim())
        }

        profileFields.social = {};
        if (youtube) profileFields.social.youtube = youtube;
        if (twitter) profileFields.social.twitter = twitter;
        if (instagram) profileFields.social.instagram = instagram;
        if (linkedin) profileFields.social.linkedin = linkedin;
        if (facebook) profileFields.social.facebook = facebook;
        
        
        try {
            let profile = await Profile.findOne({ user: req.user.id });
            if (profile) {
                profile = await Profile.findOneAndUpdate(
                    { user: req.user.id },
                    { $set: profileFields },
                    { new: true }
                );
                return res.json(profile);
            }

            profile = new Profile(profileFields);
            await profile.save();
            res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
    }
});

// @route PUT api/profile/experience
// @desc Add profile experience
// @access Public
router.put('/experience',
            [
                auth,
                [
                    body('title', 'Title is required').not().isEmpty(),
                    body('company', 'Company is required').not().isEmpty(),
                    body('from', 'From date is required').not().isEmpty()
                ]
            ], 
            async (req, res) => {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                const {
                    title,
                    company,
                    location,
                    from,
                    to,
                    current,
                    description
                } = req.body;
                
                const newExp = {
                    title,
                    company,
                    location,
                    from,
                    to,
                    current,
                    description
                };

                try {
                    const profile = await Profile.findOne({ user: req.user.id });
                    profile.experience.unshift(newExp);

                    await profile.save();
                    res.json(profile);
                } catch (err) {
                    console.error(err.message);
                    res.status(500).send('Server Error');
                }
            });

// @route PUT api/profile/education
// @desc Add profile education
// @access Public
router.put('/education',
            [
                auth,
                [
                    body('school', 'School is required').not().isEmpty(),
                    body('degree', 'Degree is required').not().isEmpty(),
                    body('fieldofstudy', 'Field of study is required').not().isEmpty(),
                    body('from', 'From date is required').not().isEmpty()
                ]
            ], 
            async (req, res) => {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                    return res.status(400).json({ errors: errors.array() });
                }
                const {
                    school,
                    degree,
                    fieldofstudy,
                    from,
                    to,
                    current,
                    description
                } = req.body;
                
                const newEdu = {
                    school,
                    degree,
                    fieldofstudy,
                    from,
                    to,
                    current,
                    description
                };

                try {
                    const profile = await Profile.findOne({ user: req.user.id });
                    profile.education.unshift(newEdu);

                    await profile.save();
                    res.json(profile);
                } catch (err) {
                    console.error(err.message);
                    res.status(500).send('Server Error');
                }
            });

// @route DELETE api/profile/experience/:exp_id
// @desc Delete experience with exp_id
// @access Private
router.delete('/experience/:exp_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        const removeIndex = profile.experience
            .map(exp => exp.id)
            .indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });

// @route DELETE api/profile/experience/:edu_id
// @desc Delete education with edu_id
// @access Private
router.delete('/education/:edu_id', auth, async (req, res) => {
    try {
        const profile = await Profile.findOne({ user: req.user.id });
        const removeIndex = profile.education
            .map(edu => edu.id)
            .indexOf(req.params.edu_id);
        profile.education.splice(removeIndex, 1);
        await profile.save();
        res.json(profile);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    });    

// @TODO: The definition seems a bit off from the RESTFUL api
// @route DELETE api/profile/user
// @desc Delete profile 
// @access Public
router.delete('/', auth, async (req, res) => {
    try {
        await Profile.findOneAndRemove({ user: req.user.id });
        await User.findOneAndRemove({ _id: req.user.id });

        res.json({ msg: 'User removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
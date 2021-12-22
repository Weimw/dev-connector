const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { body, validationResult } = require('express-validator');

const Post = require('../../models/Post');
const User = require('../../models/User');

// @route GET api/post
// @desc Get all posts
// @access Private
router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1});

        res.json(posts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route GET api/:post_id
// @desc Get post by post_id
// @access Private
router.get('/:post_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id);
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        res.json(post);
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route POST api/post
// @desc Create a post
// @access Public
router.post('/', 
    [
        auth,
        [
            body('text').not().isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const user = await User.findById(req.user.id).select('-password');

            const newPost = new Post({
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            });

            const post = await newPost.save();

            res.json(post);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
});

// @route POST api/post/comment/:post_id
// @desc Create a comment on post with post_id
// @access Private
router.post('/comment/:post_id', 
    [
        auth,
        [
            body('text').not().isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const user = await User.findById(req.user.id).select('-password');
            const post = await Post.findById(req.params.post_id);

            const newComment = {
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            };

            post.comments.unshift(newComment);
            await post.save();
            
            res.json(post.comments);   
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
});

// @route PUT api/post/likes/:post_id
// @desc Like post with post_id
// @access Private
router.put('/like/:post_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id);
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
            return res.status(400).json({ msg: 'Post already liked '});
        }

        post.likes.unshift({ user: req.user.id });
        await post.save();

        return res.json(post.likes);
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route PUT api/post/unlikes/:post_id
// @desc Unlike post with post_id
// @access Private
router.put('/unlike/:post_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id);
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        if (
            post.likes.filter(like => like.user.toString() === req.user.id).length === 0
            ) {
            return res.status(400).json({ msg: 'Post has not been liked '});
        }

        const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);
        post.likes.splice(removeIndex, 1);

        await post.save();
        return res.json(post.likes);
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route DELETE api/:post_id
// @desc Delete post by post_id
// @access Private
router.delete('/:post_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id);
        if (!post) {
            return res.status(404).json({ msg: 'Post not found' });
        }

        if (req.user.id !== post.user.toString()) {
            return res.status(401).json({ msg: 'User not authorized'});
        }

        await post.remove();
        res.json({ msg: 'Post deleted'})
    } catch (err) {
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route DELETE api/post/comment/:post_id/:comment_id
// @desc Delete a comment with comment_id on post with post_id 
// @access Private
router.delete('/comment/:post_id/:comment_id', auth, async (req, res) => {
        try {
            const post = await Post.findById(req.params.post_id);

            const comment = post.comments.find(comment => comment.id === req.params.comment_id);

            if (!comment) {
                return res.status(404).json({ msg: 'Comment does not exist' });
            }

            if (comment.user.toString() !== req.user.id) {
                return res.status(401).json({ msg: 'User not authorized'});
            }

            const removeIndex = post.comments.map(comment => comment.id).indexOf(req.params.comment_id);
            post.comments.splice(removeIndex, 1);
            await post.save();
            
            res.json(post.comments);   
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
});

module.exports = router;
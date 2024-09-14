const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const User = require('../models/user');
const auth = require('../middleware/auth');
const {sendWelcomeEmail, sendCancelationEmail} = require('../emails/account');

// creating router instance
const router = new express.Router();

// creating and configuring multer instance
const uploadAvatar = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb){
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) return cb(new Error('Please upload your profile image in .jpg, .jpeg or .png format'));

        cb(undefined, true);
    }
});

// POST method - to create a user (Sign Up or Register new Account)
router.post('/users', async (req,res)=>{
    const user = new User(req.body);
    try {
        await user.save();
        sendWelcomeEmail(user);
        const token = await user.generateAuthToken();
        res.status(201).send({user, token});
    }catch(error){
        res.status(400).send(error);
    }
});

// endpoint for login (user Authentication)
router.post('/users/login', async (req, res)=>{
    try{
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({user, token});
    }catch(error){
        res.status(400).send({error: error.message});
    }
});

// endpoint for single session (current session) logout
router.post('/users/logout', auth, async (req, res)=>{
    try{
        req.user.tokens =  req.user.tokens.filter(tokenObj=>tokenObj.token !== req.token);
        await req.user.save();
        res.send('Successfully logged out from current session');
    }catch(e){
        res.status(500).send();
    }
});

// endpoint for all session logout for a user
router.post('/users/logoutAll', auth, async (req,res)=>{
    try{
        req.user.tokens = [];
        await req.user.save();
        res.send('Successfully logged out from all the sessions');
    }catch(error){
        res.status(500).send();
    }
});

// GET method - to read his/her own profile by an user if authenticate correctly
// Adding a express middleware function in a particular route
router.get('/users/me', auth, async (req, res)=>{
    res.send(req.user);
});

// PATCH method - to update his/her user account details, who is correctly authorized to update endpoint
router.patch('/users/me', auth, async (req, res)=>{
    const fieldsAvailableToUpdate = ['name', 'email', 'password', 'age'];
    const requestFieldsToUpdate = Object.keys(req.body);
    const isValidOperation = requestFieldsToUpdate.every(requestField=>fieldsAvailableToUpdate.includes(requestField));

    if (!isValidOperation) return res.status(400).send({
        error: 'Invalid field to update'
    });

    try{
        requestFieldsToUpdate.forEach((requestFieldToUpdate)=>{
            req.user[requestFieldToUpdate] = req.body[requestFieldToUpdate];
        });

        await req.user.save();

        res.send(req.user);
    }catch(error){
        res.status(400).send(error);
    }
});

// DELETE method - to delete his/her user account, who is correctly authorized to delete endpoint
router.delete('/users/me', auth, async (req, res)=>{
    try{
        await req.user.deleteOne();
        sendCancelationEmail(req.user);
        res.send(req.user);
    }catch(error){
        res.status(500).send(error);
    }
});

// to upload profile image file of an authorized user
router.post('/users/me/avatar', auth, uploadAvatar.single('avatar'), async (req, res)=>{
    const buffer = await sharp(req.file.buffer).resize(250, 250).png().toBuffer();    // to auto-crop (resize) and change the uploaded image format in png format
    req.user.avatar = buffer;
    
    await req.user.save();
    res.send();
}, (error, req, res, next)=>{
    res.status(400).send({error: error.message});
});

// to delete the existing profile image of an authorized user
router.delete('/users/me/avatar', auth, async (req, res)=>{
    req.user.avatar = undefined;
    await req.user.save();
    res.send();
});

// to get the profile image for an user by his/her id
router.get('/users/:id/avatar', async (req, res)=>{
    try {
        const user = await User.findById(req.params.id);

        if (!user || !user.avatar) throw new Error('Profile Image not found. Please check if the user or user profile image exist.');

        res.set('Content-Type','image/png');
        res.send(user.avatar);
    } catch(error){
        res.status(404).send({error: error.message});
    }
});

module.exports = router;
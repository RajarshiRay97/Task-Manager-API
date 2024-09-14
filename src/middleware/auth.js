const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Authentication middleware to verify if the authentication token coming along eith the request is valid or not
const auth = async (req, res, next)=>{
    try{
        const token = req.header('Authorization').replace('Bearer ', '');
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({_id: decodedPayload._id, 'tokens.token': token});

        if (!user) throw new Error();
        
        req.user = user;
        req.token = token;
        next();
    }catch(error){
        res.status(401).send({error: 'Please authenticate with valid authentication token.'});
    }
}

module.exports = auth;
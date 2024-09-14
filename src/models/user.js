const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

// creating a schema of a model using mongoose
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,                // by default required is set to false, that means by default any field is optional
        minlength: [3,'Please provide atleast 3 characters'],
        trim: true
    },
    email: {
        type: String,
        unique: true,         // email field should contain unique value
        required: true,
        lowercase: true,     // data sanitization
        trim: true,          // data sanitization
        validate(data){
            if (!validator.isEmail(data)) throw new Error('Invalid Email');
        }
    },
    password: {
        type: String,
        required: true,
        minlength: [7, 'Password should be atleast 7 characters'],
        trim: true,
        validate(data){
            if (validator.contains(data, 'password', {ignoreCase: true})) throw new Error(`password field should not contain 'password'`);
        }
    },
    age: {
        type: Number,
        default: 0,           // as the field is optional, setting the default value of the field
        validate(data){                    // Customize data validator
            if (data<0){
                throw new Error('age must be a positive number');
            }
        }
    },
    tokens: [
        {
            token:{
                type: String,
                required: true
            }
        }
    ],
    avatar: {
        type: Buffer
    }
},{
    timestamps: true
});

// to create virtual field to set the relationship in between two collections
userSchema.virtual('tasks',{
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
});

// Customize mongoose with middleware functions
// to hash the plain text password before saving
userSchema.pre('save', async function (next){
    const user = this;

    // if new user has been created or password of an user has been updated, then only hash the pasword of the current user
    if (user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
});

// to delete all the tasks associated with an user before deleting that particular user
userSchema.pre('deleteOne', {document:true, query: false}, async function (next){
    const user = this;
    await Task.deleteMany({
        owner: user._id
    });
    next();
});

// Model methods - static methods of a model should define in Schema
// Customize Static Method to Find an user by the provided credentials
userSchema.statics.findByCredentials = async (email, password)=>{
    const user = await User.findOne({email});
    if (!user) throw new Error('Unable to login!');

    const isMatchedPassword = await bcrypt.compare(password, user.password);
    if (!isMatchedPassword) throw new Error('Unable to login!');

    return user;
}

// Instance/document methods - These type of methods are also define in Schema
userSchema.methods.generateAuthToken = async function(){
    const user = this;
    const token = jwt.sign({_id: user._id.toString()}, process.env.JWT_SECRET);
    user.tokens.push({token});
    await user.save();
    return token;
}

// to extract the user public profile from the main user profile
userSchema.methods.toJSON = function (){
    const user = this;
    const userPublicProfileObj = user.toObject();
    delete userPublicProfileObj.password;
    delete userPublicProfileObj.tokens;
    delete userPublicProfileObj.avatar;
    return userPublicProfileObj;
}

// creating a data model using mongoose
const User = mongoose.model('User', userSchema);

// module wxport
module.exports = User;
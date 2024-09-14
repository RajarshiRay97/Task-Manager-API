const mongoose = require('mongoose');
const validator = require('validator');

// Creating a Schema for Task model
const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        trim: true,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
},{
    timestamps: true
});

// to create Task model
const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
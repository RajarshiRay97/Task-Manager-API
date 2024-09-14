const express = require('express');
const Task = require('../models/task');
const auth = require('../middleware/auth');

const router = new express.Router();

// POST method - to create a task
router.post('/tasks', auth, async (req, res)=>{
    const task = new Task({
        ...req.body,
        owner: req.user._id
    });
    try{
        await task.save();
        res.status(201).send(task);
    }catch(error){
        res.status(400).send(error);
    }
});

// GET method - to read all the tasks of an authorized user
// to get all the tasks of an authorized user -- /tasks
// Data filtering -- /task?completed=true&search=JavaScript
// Data pagination -- /task?limit=2&skip=4
// Data sorting -- /tasks?sortBy=createdAt:desc
router.get('/tasks', auth, async (req, res)=>{
    let options = {};
    const match = !req.query.completed?{}:{completed: req.query.completed==='true'};
    if (req.query.search){
        const search = req.query.search;
        match.description = {
            $regex: new RegExp(`${search}`),
            $options: 'i'
        }
    }
    
    if (req.query.limit && req.query.skip){
        options = {
            limit: parseInt(req.query.limit),
            skip: parseInt(req.query.skip)
        }
    }
    else if (req.query.limit) {
        options = {
            limit: parseInt(req.query.limit),
        }
    }
    else if (req.query.skip){
        options = {
            skip: parseInt(req.query.skip)
        }
    }

    if (req.query.sortBy){
        options.sort = {};
        const sortQueryArr = req.query.sortBy.split(':');
        options.sort[sortQueryArr[0]] = (sortQueryArr[1] === 'desc')?-1:1;
    }
    
    try{
        await req.user.populate({
            path: 'tasks',
            match,
            options
        });
        res.send(req.user.tasks);
    }catch(error){
        res.status(500).send(error);
    }
});

// GET method - to read the targeted task by id of an authorized user
router.get('/tasks/:id', auth, async (req, res)=>{
    const _id = req.params.id;
    try{
        const task = await Task.findOne({_id, owner: req.user._id});
        if (!task) return res.status(404).send();
        res.send(task);
    }catch(error){
        res.status(500).send(error);
    }
});

// PATCH method - to update the targeted task by it's id by the authorized user
router.patch('/tasks/:id', auth, async (req, res)=>{
    const fieldsAvailableForUpdate = ['description', 'completed'];
    const fieldsRequestedForUpdate = Object.keys(req.body);
    const isValidOperation = fieldsRequestedForUpdate.every(requestedField=>fieldsAvailableForUpdate.includes(requestedField));

    if (!isValidOperation) return res.status(400).send({error: 'Provided fieldes not allowed to update.'});

    try{
        const task = await Task.findOne({
            _id: req.params.id,
            owner: req.user._id
        });
        if (!task) return res.status(404).send();

        fieldsRequestedForUpdate.forEach((fieldRequestedForUpdate)=> task[fieldRequestedForUpdate] = req.body[fieldRequestedForUpdate]);
        await task.save();
        res.send(task);
    }catch(error){
        res.status(400).send(error);
    }
});

// DELETE method - to delete the targeted task by it's id by an autjorized user
router.delete('/tasks/:id', auth, async (req,res)=>{
    try{
        const task = await Task.findOneAndDelete({
            _id: req.params.id,
            owner: req.user._id
        });

        if (!task) return res.status(404).send();
        res.send(task);
    }catch(error){
        res.status(500).send(error);
    }
});

module.exports = router;
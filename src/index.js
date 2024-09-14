const express = require('express');
const dbConnect = require('./db/mongoose.js');
const userRouter = require('./routers/user.js');
const taskRouter = require('./routers/task.js');

// to connect with mongodb
dbConnect().then(()=>{
    console.log('connected to Mongodb Server');
}).catch((error)=>{
    console.log(error);
});

const port = process.env.PORT;
const app = express();

// built-in middleware
app.use(express.json());     // to parse the json request body
app.use(userRouter);         // to register the userRouter in express app
app.use(taskRouter);         // to register the taskRouter in express app

// to start the server, so that it can listen in the targeted port
app.listen(port, ()=>{
    console.log(`Task Manager REST API is up and running on port ${port}`);
});
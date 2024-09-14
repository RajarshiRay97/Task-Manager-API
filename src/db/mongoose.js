const mongoose = require('mongoose');

async function dbConnect(){
    // using mongoose to connect with the targeted database in a database server
    await mongoose.connect(process.env.MONGODB_URL);
}

module.exports = dbConnect;
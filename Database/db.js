const mongoose = require('mongoose')
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect('mongodb://127.0.0.1:27017/datingApp',
    // process.env.MONGO_DB_URI,
     
    {
    useNewUrlParser:true,useunifiedtopology:true, 
}).then(()=>{
    console.log("DataBase connected");
}).catch(()=>{
    console.log("data base not connected");
});
module.exports = mongoose;

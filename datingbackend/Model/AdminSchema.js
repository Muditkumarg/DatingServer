const mongoose = require('mongoose');

const SignUpSchema = mongoose.Schema({

    name: {
        type: String,
        required:true
    },
    email: {
        type: String,
        required:true
    },
    password: {
        type: String,
        required:true
    },
  
    refrenceId:{
        type:String
    },
   
})

const adminData = mongoose.model('AdminSignUp', SignUpSchema);


module.exports = adminData;
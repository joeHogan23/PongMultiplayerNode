var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');


var UserSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    wins:{
        type:String,
        required: false
    },

    email:{
        type:String,
        required:false,
    },
    password:{
        type:String,
        required:false,
    },
    date:{
        type:Date,
        default:Date.now
    }
});

module.exports = mongoose.model('Users', UserSchema);
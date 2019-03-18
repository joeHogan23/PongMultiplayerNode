var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    wins:{
        type:String,
        required: false
    },

    password:{
        type:String,
        required:true,
    },
    date:{
        type:Date,
        default:Date.now
    }
});

mongoose.model('Users', UserSchema);
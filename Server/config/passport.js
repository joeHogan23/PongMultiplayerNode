var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');

var User = mongoose.model('Users');

module.exports = function(passport){

    passport.use(new LocalStrategy({usernameField:'name'}, function(name, password, done){
        
        bcrypt.genSalt();
        User.findOne({
            name:name
        }).then(function(user){

            if(!user){
                return done(null, false, {message:"No User found"});
            }else
            

            bcrypt.compare(password, user.password, function(err, isMatch){
                console.log(password);
                console.log(user.password);
                console.log(isMatch);

                if(err)throw err;
                if(isMatch){
                    console.log(password);
                    return done(null,user);
                }
                else{
                    return done(null, false, {message:'password incorrect'});
                }
            });
        });
    }));

    passport.serializeUser(function(user, done){
        done(null,user.id);
    });

    passport.deserializeUser(function(id, done){
        User.findById(id, function(err, user){
            done(err, user);
        });
    });
}


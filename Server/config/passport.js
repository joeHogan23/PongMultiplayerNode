const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

var User = mongoose.model('Users');

module.exports = function(passport){
    passport.use(new LocalStrategy({usernameField:'email'}, function(email,password,done){
        User.findOne({
            email:email
        }).then(function(user){
            if(!user){
                return done(null, false, {message:"No User Found"});
            }
             
            bcrypt.compare(password, user.password, function(err, isMatch){
                if(err) throw err;
                if(isMatch){
                    return done(null, user);
                }else
                return done(null, false, {message:'password incorrect'});
            });
        });
    }));

    passport.serializeUser(function(user, done){
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done){
        User.findById(id,function(err,user){
            done(err, user);
        });
    });
}
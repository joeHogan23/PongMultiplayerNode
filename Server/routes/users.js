const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const bcrypt = require('bcryptjs');

//#region Load Models
require('../models/users');
var User = mongoose.model('Users');
//#endregion

router.get('/newuser', function(req,res){
    res.render('users/newuser');
});

router.post('/newuser', function(req,res){
    var errors = [];

    if(req.body.password != req.body.password2){
        errors.push({text:"Passwords do not Match"});
    };

    if(req.body.password.length < 4){
        errors.push({text:"Password is Less than 4 characters"});
    }

    if(errors.length > 0){
        res.render('users/newuser',{
            errors:errors, 
            first_name:req.body.first_name,
            middle_name:req.body.middle_name,
            last_name:req.body.last_name,
            email:req.body.email
        })
    }
    else
    {
        User.findOne({email:req.body.email})
        .then(function(user){
            if(user){
                res.redirect('/users/newuser');
            }

            //Add FLASH MESSAGE THAT USER EXISTS!
            else{
                var newUser = new User({
                    user_id:"222222",
                    first_name:req.body.first_name,
                    middle_name:req.body.middle_name,
                    last_name:req.body.last_name,
                    email:req.body.email,
                    password:req.body.password,
                    date_of_birth:"123456",
                    role:"admin"
                });

                bcrypt.genSalt(10,function(err, salt){
                    bcrypt.hash(newUser.password, salt, function(err,hash){
                        if(err)throw err;
                        newUser.password = hash;
                        newUser.save()
                        .then(
                            function(user){
                                //flash message
                                res.redirect('/');

                            })
                            .catch(function(err){
                                console.log(err);
                            })
                    })
                })
            }
        });
    }
});

module.exports = router;
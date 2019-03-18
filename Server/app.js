const io = require('socket.io')(process.env.PORT||5000);
const shortid = require('shortid');
const express = require('express');
const app = express();
const router = express.Router({mergeParams: true});
const mongoose = require('mongoose');
const exphbs  = require('express-handlebars');
const {ensureAuthenticated} = require('./helpers/auth');
const passport = require('passport');
const bodyparser = require('body-parser');
const path = require('path');
const logger = require('morgan');

const session = require('express-session');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
var waitingForNewHost = true;
var ready = [];



var hostId;
var guestId;
var resettingBoard = false;

const port = 3000;

const users = require('./routes/users');
require('./config/passport')(passport);

var db = require('./config/database');


    //Setup body-parser to read req data in html
    app.use(bodyparser.urlencoded({extended:false}));
    app.use(bodyparser.json());
    
    
    //Setup Express Session
    app.use(session({   
        secret:'secret',
        resave:true,
        saveUninitialized:true
    }));  

//     app.use(express.cookieParser());
//   app.use(express.bodyParser());
//   app.use(express.cookieSession()); // Express cookie session middleware 

    app.use(passport.initialize());
    app.use(passport.session());
    

app.use(express.json());

//extension of method library in HTML forms
app.use(methodOverride('_method'));
router.use('/users', users);

    app.use(express.static(__dirname + '/views'));
    app.use(express.static(__dirname + '/scripts'));
    
console.log("Server Running");


//gets rid of warning for Mongoose
mongoose.Promise = global.Promise;


//connect to mongodb using mongoose
mongoose.connect(db.mongoURI, {
    useMongoClient:true
})
    .then(function () { console.log("MongoDB Connected") })
    .catch(function (err) { console.log(err) });

//Load in Models
require('./models/users');
var Users = mongoose.model('Users');

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

require('handlebars');
require('handlebars/runtime');

//#region Page Routes

//Route to entries.html
router.get('/',function(req,res){
    console.log("Directing To Login Page");
    res.render('login');
});

router.get('/topten', ensureAuthenticated, function(req,res){
    console.log("Directing To Login Page");
    res.render('topTenPlayers');
});

router.get('/updateinfo', ensureAuthenticated, function(req,res){
    console.log("Directing To Login Page");
    res.render('topTenPlayers');
});

//Route to new user page
router.get('/newuser',function(req,res){
    res.render('newuser');
});

//*********************************** */
//WHERE THE TOP TEN IS
//*********************************** */
app.get('/topten', function(req,res){

    Users.find({}).limit(10).
    then(function(users){
        res.render('topTenPlayers', {user:users});    
    })
});
//#endregion

//#region Action Routes

router.post('/log',function(req,res,next){
    passport.authenticate('local', {
        successRedirect:'/topten',
        failureRedirect:'/'
    })(req,res,next);
});

//#endregion


//#region Socket.IO
var players = [];

io.on('connection',function(socket)
{
    var playerNumber = 0;

    var loggedUser;

    console.log("Connected to Unity");
    socket.emit('connected');
    var thisPlayerId = shortid.generate();
    var thisBallId = shortid.generate();

    //Defines which player is on which side
    var horizontalPos = 7;

    if(waitingForNewHost){
        horizontalPos = -7;
        hostId = thisPlayerId;
    }else
        guestId = thisPlayerId;

    var player = {
        id:thisPlayerId,
        isHost: waitingForNewHost,
        position:{
            v:0,
            h:horizontalPos
        },
        ready:false,
        score:0,
        wins:5
    }

    players[thisPlayerId] = player;
    socket.emit('register', {id:thisPlayerId});
    socket.broadcast.emit('spawn', {id:thisPlayerId});
    socket.broadcast.emit('requestPosition');

    for(var playerId in players){        
        if(playerId == thisPlayerId)
        continue;
        socket.emit('spawn', players[playerId]);
        console.log('Sending spawn to new with ID', thisPlayerId);
    }

    if(waitingForNewHost){
        waitingForNewHost = false;
        socket.emit('spawnHostBall');
    }else{
        socket.emit('setNetworkPlayerPosition', {id:thisPlayerId })
        socket.emit('spawnNetworkBall');
    };

    socket.on('checkReady', function(){
        players[thisPlayerId].ready = true;

        if(players[hostId] !=null && players[guestId] !=null)
        if(players[hostId].ready == true && players[guestId].ready == true)
        io.emit('startGame');
    })

//#region  Handshake Notification
    socket.on('sayhello', function(data){
        console.log("Unity Game says hello");
        socket.emit('talkback');
    });
//#endregion

//#region Setup Game

    socket.on('initializeAllActors', function(){
        // socket.emit('resetScores');
        io.emit('startGame');
    });

    socket.on('resetRound', function(){
        io.emit('resetPlayerPosition');
        io.emit('startGame');
    })

    socket.on('score', function(data){
        if(data.h > 0){
            player[hostid]+=1;
            io.emit('playerScored', hostid)
            

        }else{
            player[guestId]+= 1;
            io.emit('playerScored', guestId);
        }

        socket.emit('resetHostBall');
        io.emit('resetPlayerPosition');

    })

    // socket.on('stopGame',function(){
    //     io.emit('stopGame');
    // });

//#endregion

//#region Player Movement Handlers

    socket.on('move', function(data){
        data.id = thisPlayerId;
        console.log("Player Moved", JSON.stringify(data));

        socket.broadcast.emit('move', data);
    });

    socket.on('moveHostBall', function(data){
        socket.broadcast.emit('moveNetworkBall', data);

        console.log(data.v);

        // if(players[guestId] != null && 
        //     data.v > players[guestId].position.h + 3)
        // {        
        //     io.emit("stopGame");
        //     io.emit('resetPlayerPosition');
        //     io.emit('resetHostBall');
        //     players[hostId].score++;
        //     console.log("Player: " + hostId + " scored!");
        //     io.emit('playerScored', {id:hostId});
        // }
        // else if(players[hostId] != null && 
        //     data.v < players[hostId].position.h - 3)
        // {
        //     io.emit("stopGame");
        //     io.emit('resetPlayerPosition');
        //     io.emit('resetHostBall');

        //     io.emit("playerScored", {id:guestId});
        //     console.log("Player: " + guestId + " scored!");
        // }
    });

    socket.on('updatePosition', function(data){
        data.id = thisPlayerId;
        socket.broadcast.emit('updatePosition', data);
    });

//#endregion

//#region Ball Movement Handlers
// socket.on('moveHostBall', function(data){
//     socket.broadcast.emit("moveNetworkBall", data);
// })   

//#endregion

//#region Add Users to Database
    socket.on('senddata', function(data){
        console.log(JSON.stringify(data));


        // var exists = Users.find({name:user.name, password:user.password}).limit(1);

        // console.log(exists);
        // Users.find({name:user.name, password:user.password}).limit(1)
        // .then(function(users){

        //     console.log("Sending Data to Database");
        //     Users.find({})
        //     .then(function(users){
        //         // console.log(users);
        //         socket.emit('hideform', {users});
        //     });
        // });
        // // }else{
            var user;
            bcrypt.genSalt(10,function(err, salt){
                bcrypt.hash(data.password, salt, function(err,hash){
                    if(err)throw err;
                    user = new Users ({
                        name:data.name,
                        password:hash,
                        wins: 0,
                        gamesplayed:0
                    });
                    // user.password = hash;
                    console.log(hash);
                    console.log(user.password);

                    user.save()
                    .then(function(users){
                        console.log("Sending Data to Database");
                        Users.find({})
                        .then(function(users){
                            console.log(users);
                            socket.emit('hideform', {users});
                        });
                    });
                });
                Users.find({}).sort({ wins: -1 });
            })

        // }
    });

    //#endregion

//#region Disconnect Players
    socket.on('disconnect', function(){
        console.log("Player Disconnected");
        
        io.emit('stopGame');

        if(players[thisPlayerId] != null && 
            players[thisPlayerId].isHost){
            waitingForNewHost = true;
            socket.broadcast.emit('disconnectAll');
        }

        delete players[thisPlayerId];
        socket.broadcast.emit('disconnected', {id:thisPlayerId});
    } );

//#endregion
});
app.use('/', router);

//Start server
app.listen(port, function(){
    console.log("Server is running on port " + port);
});

//#endregion
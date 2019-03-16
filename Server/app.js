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

const session = require('express-session');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');

var waitingForNewHost = true;

var hostId;
var guestId;
var resettingBoard = false;

const port = 3000;

const users = require('./routes/users');
require('./config/passport')(passport);

app.use(express.json());

//extension of method library in HTML forms
app.use(methodOverride('_method'));
router.use('/users', users);

//gets rid of warning for Mongoose
mongoose.Promise = global.Promise;

//connect to mongodb using mongoose
var db = new mongoose.connect("mongodb://localhost:27017/multiplayergamedata", {
    useMongoClient:true
})
    .then(function () { console.log("MongoDB Connected") })
    .catch(function (err) { console.log(err) });

//Load in Models
require('./models/users');
var Users = mongoose.model('Users');
require('./config/database');

    app.use(express.static(__dirname + '/views'));
    app.use(express.static(__dirname + '/scripts'));
    
    app.use(passport.initialize());
    app.use(passport.session());
    
    //Setup body-parser to read req data in html
    app.use(bodyparser.urlencoded({extended:false}));
    app.use(bodyparser.json());
    
    //Setup Express Session
    app.use(session({   
        secret:'secret',
        resave:true,
        saveUninitialized:true
    }));  

console.log("Server Running");

require('handlebars');
require('handlebars/runtime');

app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

//#region Page Routes

//Route to entries.html
router.get('/',function(req,res){
    console.log("Directing To Login Page");
    res.render('login');
});



//#endregion

//#region Action Routes

router.post('/log',function(req,res,next){
    passport.authenticate('local', {
        successRedirect:'/defectspage',
        failureRedirect:'/'
    })(req,res,next);
});

//#endregion

app.use('/', router);

//Start server
app.listen(port, function(){
    console.log("Server is running on port " + port);
});

//#region Socket.IO
var players = [];

io.on('connection',function(socket)
{
    var playerNumber = 0;
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
        score:0,
        wins:0
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
        socket.emit('initialize');
    };

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
        // io.emit('stopGame');
        // io.emit('resetPlayerPosition');
        io.emit('startGame');
    })

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


        if(players[guestId] != null && 
            data.v > players[guestId].position.h + 3)
        {        
            io.emit("stopGame");
            io.emit('resetPlayerPosition');
            io.emit('resetHostBall');
            players[hostId].score++;
            console.log("Player: " + hostId + " scored!");
            io.emit('playerScored', {id:hostId});
        }
        else if(players[hostId] != null && 
            data.v < players[hostId].position.h - 3)
        {
            io.emit("stopGame");
            io.emit('resetPlayerPosition');
            io.emit('resetHostBall');

            io.emit("playerScored", {id:guestId});
            console.log("Player: " + guestId + " scored!");
        }
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
        var newUser = {
            name:data.name,
        }
        new Users(newUser)
        .save()
        .then(function(users){
            console.log("Sending Data to Database");
            Users.find({})
            .then(function(users){
                console.log(users);
                socket.emit('hideform', {users});
            });
        });
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
//#endregion
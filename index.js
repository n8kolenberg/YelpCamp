const express                   = require('express'),
      app                       = express(),
      bodyParser                = require('body-parser'),
      mongoose                  = require('mongoose'),
      CampGround                = require('./models/campground.js'),
      Comment                   = require('./models/comment.js'),
      User                      = require("./models/user.js"),
      passport                  = require("passport"),
      localStrategy             = require("passport-local"),
      passportLocalMongoose     = require("passport-local-mongoose"),
      methodOverride            = require("method-override"),
      seedDB                    = require('./seeds');

//Require routes
const indexRoutes               = require("./routes/index.js"),
      campgroundRoutes          = require("./routes/campgrounds.js"),
      commentRoutes             = require("./routes/comments.js");

/* Connecting mongoose to MongoDB */
mongoose.connect('mongodb://127.0.0.1/campGrounds');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(__dirname + '/public'));
// console.log(__dirname); Users/n.kolenberg/documents/code/projects/Express/YelpCamp/v3

app.use(methodOverride("_method"));
seedDB();


/* ======================================
   PASSPORT CONFIG
   ====================================== */
app.use(require("express-session")({
    secret: "YelpCamp is the best app ever",
    resave: false,
    saveUninitialized: false
}));

//Initialize passport
app.use(passport.initialize());
app.use(passport.session());

//User.authenticate() -> method possible because of line 10 in user.js
//userSchema.plugin(passportLocalMongoose);
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


/* ======================================
   MIDDLEWARE
   ====================================== */
//This is our own defined middleware
//Whatever we put in res.locals is what's available inside our templates
//This is a middleware that runs for every single route
app.use((req, res, next) => {
    //req.user will have the username and user id 
    //of the user that is signed in and undefined otherwise
    res.locals.currentUser = req.user;
    //We need to add next() so that it goes to the routehandler
    next();
});




/* ======================================
   ROUTES
   ====================================== */
//Initialize use of required routes
app.use(indexRoutes);
/*You can add in a string parameter to ensure that all routes inside the file start 
with this string, in the below case: '/campgrounds'
I can then remove '/campgrounds from the routes in campgroundRoutes.js'*/
app.use("/campgrounds", campgroundRoutes);
app.use(commentRoutes);



//CATCH ALL ROUTE
app.get('*', (req, res) => {
    res.render("404");
});


app.listen(3000, () => {
    console.log('YelpCamp listening on port 3000!');
});


/*
Restful Routes
name    url         verb    desc
INDEX   /dogs       GET     Display a list of all dogs
NEW     /dogs/new   GET     Displays a form to make a new dog
CREATE  /dogs       POST    Add a new dog to the DB
SHOW    /dogs/:id    GET    Show info about 1 dog



*/
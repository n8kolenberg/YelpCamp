const express                   = require('express'),
      app                       = express(),
      bodyParser                = require('body-parser'),
      mongoose                  = require('mongoose'),
      CampGround                = require('./models/campground.js'),
      Comment                   = require('./models/comment.js'),
      User                      = require("./models/user.js"),
      passport                  = require("passport"),
      FacebookStrategy          = require("passport-facebook").Strategy,
      localStrategy             = require("passport-local"),
      passportLocalMongoose     = require("passport-local-mongoose"),
      methodOverride            = require("method-override"),
      flash                     = require("connect-flash"),
      dotenv                    = require("dotenv").config(),
      fs                        = require("fs"),
      https                     = require("https"),
      seedDB                    = require('./seeds');

//Require routes
const indexRoutes               = require("./routes/index.js"),
      campgroundRoutes          = require("./routes/campgrounds.js"),
      commentRoutes             = require("./routes/comments.js")


/* Connecting mongoose to MongoDB */
//DB URL set up on Heroku by typing heroku config:set DATABASEURL= xxxx in terminal
mongoose.connect(process.env.DATABASEURL);

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(__dirname + '/public'));
// console.log(__dirname); Users/n.kolenberg/documents/code/projects/Express/YelpCamp/v3

app.use(methodOverride("_method"));
app.use(flash()); //This MUST be before the passport configuration
// seedDB(); //Seed the database


/* Incorporating moment.js 
Now moment is available for use in all of your view files via the variable named moment*/
app.locals.moment = require("moment");

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

//User.authenticate() -> method possible because of following line in user.js
//userSchema.plugin(passportLocalMongoose);
passport.use(new localStrategy(User.authenticate()));

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    })
})


/*====== FACEBOOK LOGIN LOGIC ========*/
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FB_CALLBACK_URL,
    profileFields: ['id', 'displayName', 'picture.type(large)', 'email']
},
    (accessToken, refreshToken, profile, done) => {
        //For asynchronous handling of the incoming Facebook data, we use NodeJS' process.nextTick()
        process.nextTick(() => {
            // eval(require("locus"));
            //We try to find the user with their Facebook profile id
            User.findOne({"facebook.id" : profile.id}, (err, user) => {
                if(err) {
                    console.log(err.message);
                    return done(err);
                }
                if(user) {
                    return done(null, user)
                }
                //If the user's FB id was not found in the DB, we register them
                if (!user) {
                    let newUser = new User();
                    newUser.facebook.id = profile.id;
                    newUser.facebook.token = accessToken;
                    newUser.facebook.name = `${profile.displayName}`;
                    newUser.facebook.email = profile.emails[0].value;
                    newUser.local.email = profile.emails[0].value;
                    newUser.local.avatar = profile.photos[0].value;
                    newUser.save((err) => {
                        if (err) {
                            console.log(err.message);
                            throw err;
                        }
                        return done(null, newUser);
                    });
                } //End if(!user)
                
            });
        });     
     })//End new FacebookStrategy
);//End passport.use



/* ======================================
   MIDDLEWARE
   ====================================== */
//This is our own defined middleware
//Whatever we put in res.locals is what's available inside our templates
//This is a middleware that runs for every single route
app.use((req, res, next) => {
    //req.user will have the username and user id 
    //of the user that is signed in and undefined otherwise
    //You can then user 'currentUser' as the variable in the routes
    res.locals.currentUser = req.user;
    //We need to add next() so that it goes to the routehandler

    /* if there's anything in the flash, we'll have access to it in the template as an
    error or a success variable */
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    res.locals.info = req.flash("info");

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


app.listen(process.env.PORT, () => {
    console.log(`YelpCamp listening on port ${process.env.PORT}!`);
});


/*
Restful Routes
name    url         verb    desc
INDEX   /dogs       GET     Display a list of all dogs
NEW     /dogs/new   GET     Displays a form to make a new dog
CREATE  /dogs       POST    Add a new dog to the DB
SHOW    /dogs/:id    GET    Show info about 1 dog



*/
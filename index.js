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
      seedDB                    = require('./seeds');


/* Connecting mongoose to MongoDB */
mongoose.connect('mongodb://127.0.0.1/campGrounds');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(__dirname + '/public'));
// console.log(__dirname); Users/n.kolenberg/documents/code/projects/Express/YelpCamp/v3
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
function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    res.redirect("/login");
}

//Whatever we put in res.locals is what's available inside our templates
//This is a middleware that runs for every single route
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    //We need to add next() so that it goes to the routehandler
    next();
});




/* ======================================
   ROUTES
   ====================================== */
app.get('/', (req, res) => {
    res.render("landing");
});

app.get("/campgrounds", (req, res) => {
    let campGrounds = CampGround.find({}, (err, allcampGrounds) => {
        if (err) {
            console.log("There was an error getting the campgrounds: ");
            console.log(err);
        } else {
            res.render('campgrounds/campgrounds', {campGrounds: allcampGrounds, currentUser: req.user});
        }
    });
});

app.post("/campgrounds", (req, res) => {
    CampGround.create({
        name: req.body.name,
        image: req.body.image,
        description: req.body.description
    }, (err, newCampGround) => {
        if(err) {
            console.log("Error during creation: ");
            console.log(err);
        } else {
            //Redirect back to campgrounds
            res.redirect("campgrounds/campgrounds");
        }
    });

});

//This renders a form that allows above post method to be called
app.get("/campgrounds/new", isLoggedIn, (req, res) => {
    res.render("campgrounds/new");
});


app.get('/campgrounds/:id', (req, res) => {
    //Find the campground with provided id
    //Then populate the comments from the ids that are associated with the campGround
    //Then execute the callback function
    CampGround.findById(req.params.id).populate("comments").exec((err, foundCamp) => {
        if (err) {
            console.log(err);
        } else {
            res.render("campgrounds/show", { foundCamp: foundCamp });
        }
    });
});


//============================
//COMMENTS ROUTES
//============================
// NEW campgrounds/:id/comments/new GET
app.get("/campgrounds/:id/comments/new", (req, res)=>{
    //Find the campground id
    CampGround.findById(req.params.id, (err, campground) => {
        if (err) {
            console.log(err);
        } else {
            res.render("comments/new", {campground: campground});
        }
    });
    
});

// CREATE campgrounds/:id/comments POST
app.post('/campgrounds/:id/comments', isLoggedIn, (req, res) => {
    //lookup the campground using id
    CampGround.findById(req.params.id, (err, campground) => {
        if(err) {
            console.log(err);
            res.redirect("/campgrounds");
        } else {
            //Create new comment
            Comment.create(req.body.comment, (err, newComment) => {
                if(err) {
                    console.log(err);
                } else {
                    //Connect new comment to campground
                    campground.comments.push(newComment._id);
                    campground.save();
                    //Redirect back to campground show page
                    res.redirect(`/campgrounds/${campground._id}`);
                }
            }); //End Comment.create()
        } //End else statement
    }); //End Campground.findById()
}); //End app.get()




/* ======================================
   AUTH ROUTES
   ====================================== */
//Show the register form
   app.get("/register", (req, res) => {
    res.render("register");
});

//Handle sign up logic
app.post("/register", (req, res) => {
    let newUser = new User({
        username: req.body.username
    });
    User.register(newUser, req.body.password, (err, user)=>{
        if(err) {
            console.log(err);
            return res.render("register");
        } 
        passport.authenticate("local")(req, res, () => {
            res.redirect("/campgrounds");
        });
    } );
});

//Show the login form
app.get("/login", (req, res)=>{
    res.render("login");
});

//Handle the login logic
app.post("/login", passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
}), (req, res) => {});



//Logout routes
app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/campgrounds");
});



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
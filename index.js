const express       = require('express'),
      app           = express(),
      bodyParser    = require('body-parser'),
      mongoose      = require('mongoose'),
      CampGround    = require('./models/campground.js'),
      seedDB        = require('./seeds');



/* Connecting mongoose to MongoDB */
mongoose.connect('mongodb://127.0.0.1/campGrounds');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static('public'));
seedDB();


app.get('/', (req, res) => {
    res.render("landing");
});

app.get("/campgrounds", (req, res) => {
    let campGrounds = CampGround.find({}, (err, allcampGrounds) => {
        if (err) {
            console.log("There was an error getting the campgrounds: ");
            console.log(err);
        } else {
            res.render('campgrounds', {campGrounds: allcampGrounds});
        }
    });
    
    // res.render("campgrounds", {
    //     campGrounds: campGrounds
    // });
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
            res.redirect("/campgrounds");
        }
    });

});

//This renders a form that allows above post method to be called
app.get("/campgrounds/new", (req, res) => {
    res.render("new");
});


app.get('/campgrounds/:id', (req, res) => {
    //Find the campground with provided id
    //Then populate the comments from the ids that are associated with the campGround
    //Then execute the callback function
    CampGround.findById(req.params.id).populate("comments").exec((err, foundCamp) => {
        if (err) {
            console.log(err);
        } else {
            res.render("show", { foundCamp: foundCamp });
        }
    });
});


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
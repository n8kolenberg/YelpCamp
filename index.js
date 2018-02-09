const express       = require('express'),
      app           = express(),
      bodyParser    = require('body-parser'),
      mongoose      = require('mongoose'),
      CampGround    = require('./models/campground.js'),
      Comment       = require('./models/comment.js'),
      seedDB        = require('./seeds');


/* Connecting mongoose to MongoDB */
mongoose.connect('mongodb://127.0.0.1/campGrounds');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static(__dirname + '/public'));
// console.log(__dirname); Users/n.kolenberg/documents/code/projects/Express/YelpCamp/v3
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
            res.render('campgrounds/campgrounds', {campGrounds: allcampGrounds});
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
            res.redirect("campgrounds/campgrounds");
        }
    });

});

//This renders a form that allows above post method to be called
app.get("/campgrounds/new", (req, res) => {
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
app.post('/campgrounds/:id/comments', (req, res) => {
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
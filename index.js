const express = require('express');
const app = express();
const bodyParser = require('body-parser');

/* Getting mongoose in and connecting it to MongoDB */
const mongoose = require('mongoose');
mongoose.connect('mongodb://127.0.0.1/campGrounds');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(express.static('public'));


/*Mongoose Object Data Model set up*/
//Define the Schema or pattern of the campgrounds
let campGroundSchema = new mongoose.Schema({
    name: String,
    image: String,
    description: String
});
//Define the model
let CampGround = mongoose.model('CampGround', campGroundSchema);


// CampGround.create({
//     name: "Mountainside's Rest",
//     image: "http://d2s0f1q6r2lxto.cloudfront.net/pub/ProTips/wp-content/uploads/2017/04/how-to-set-up-a-campsite.jpg",
//     description: "Beautiful nature with a relaxing view"
// }, (err, newcampground) => {
//     if(err) {
//         console.log(err);
//     } else {
//         console.log(newcampground);
//     }
// });



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
    CampGround.findById(req.params.id, (err, foundCamp) => {
        if(err) {
            console.log(err);
        } else {
            res.render("show", { camp: foundCamp });
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
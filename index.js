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
    image: String
});
//Define the model
let CampGround = mongoose.model('CampGround', campGroundSchema);


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
        image: req.body.image
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


app.get('*', (req, res) => {
    res.render("404");
});


app.listen(3000, () => {
    console.log('YelpCamp listening on port 3000!');
});
const express           = require("express"),
      router            = express.Router({mergeParams: true}),
      CampGround        = require("../models/campground"),
      isLoggedIn        = require("../middleware/loggedIn");


router.get("/", (req, res) => {
    let campGrounds = CampGround.find({}, (err, allcampGrounds) => {
        if (err) {
            console.log("There was an error getting the campgrounds: ");
            console.log(err);
        } else {
            res.render('campgrounds/campgrounds', { campGrounds: allcampGrounds, currentUser: req.user });
        }
    });
});

router.post("/", (req, res) => {
    CampGround.create({
        name: req.body.name,
        image: req.body.image,
        description: req.body.description
    }, (err, newCampGround) => {
        if (err) {
            console.log("Error during creation: ");
            console.log(err);
        } else {
            //Redirect back to campgrounds
            res.redirect("campgrounds/campgrounds");
        }
    });

});

//This renders a form that allows above post method to be called
router.get("/new", isLoggedIn, (req, res) => {
    res.render("campgrounds/new");
});


router.get('/:id', (req, res) => {
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

module.exports = router;
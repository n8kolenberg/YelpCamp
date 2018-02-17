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


//This renders a form that allows the below post method to be called
router.get("/new", isLoggedIn, (req, res) => {
    res.render("campgrounds/new");
});


//Creating and saving a new campGround
router.post("/", isLoggedIn, (req, res) => {
    let author = {
        id: req.user._id,
        username: req.user.username
    };
    let newCampGround = {
        name: req.body.name,
        image: req.body.image,
        description: req.body.description,
        author: author
    };
    CampGround.create(newCampGround, (err, newlyCreatedCampGround) => {
        if (err) {
            console.log("Error during creation: ");
            console.log(err);
        } else {
            //Redirect back to campgrounds
            res.redirect(`/campgrounds/${newlyCreatedCampGround._id}`);
        }
    });

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

//EDIT CAMPGROUND
router.get("/:id/edit", (req, res) => {
    CampGround.findById(req.params.id, (err, foundCampGround) => {
        if(err) {
            console.log(err);
        } else {
            res.render("campgrounds/edit", { campground: foundCampGround });
        }
    });
    
});

//UPDATE CAMPGROUND 
router.put("/:id/", (req, res) => {
    //Find and update the correct campground
    CampGround.findByIdAndUpdate(req.params.id, req.body.campground, (err, updatedCampGround) => {
        if(err) {
            console.log(err);
        } else {
            res.redirect(`/campgrounds/${updatedCampGround._id}`);
        }
    });
});



module.exports = router;
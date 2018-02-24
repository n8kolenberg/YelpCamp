const express                   = require("express"),
      router                    = express.Router({mergeParams: true}),
      CampGround                = require("../models/campground"),
    //   isLoggedIn                = require("../middleware/loggedIn"),
    //   checkCampGroundOwnership  = require("../middleware/checkCampGroundOwnership"),
//Because we called our middleware file index.js, we don't need to specify it in the 
//require statement. Index.js is a special name where unless otherwise named, the program
//will always look for a file named index.js - see nodemodules/express folder as an example
//We don't define a name, but it will be looking for nodemodules/express/index.js
      middleware                = require("../middleware");


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
router.get("/new", middleware.isLoggedIn, (req, res) => {
    res.render("campgrounds/new");
});


//Creating and saving a new campGround
router.post("/", middleware.isLoggedIn, (req, res) => {
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
            req.flash("success", "Sweet! Your campground has been successfully created!");
            //Redirect back to campgrounds
            res.redirect(`/campgrounds/${newlyCreatedCampGround._id}`);
        }
    });

});

//GET CAMPGROUND BY ID
router.get('/:id', (req, res) => {
    //Find the campground with provided id
    //Then populate the comments from the ids that are associated with the campGround
    //Then execute the callback function
    CampGround.findById(req.params.id).populate("comments").exec((err, foundCamp) => {
        //If there's an err or there's no foundCamp, i.e. the db returns null (and !null = true)
        if (err || !foundCamp) {
            console.log(err);
            req.flash("error", "Campground not found!");
            res.redirect("back");
        } else {
            res.render("campgrounds/show", { foundCamp: foundCamp });
        }
    });
});

//EDIT CAMPGROUND FORM
//checkCampGroundOwnership is a self-made middleware imported from /middleware/checkCampGroundOwnership
router.get("/:id/edit", middleware.checkCampGroundOwnership, (req, res) => {
    CampGround.findById(req.params.id, (err, foundCampGround) => {
        if(err) {
            console.log(err);
            req.flash("error", "Woops! Now that's embarrassing... We couldn't find that campground in our database. Maybe try again later?");
            res.redirect("back");
        } else {
            res.render("campgrounds/edit", { campground: foundCampGround });    
        }
    });
});

//UPDATE CAMPGROUND 
router.put("/:id/", middleware.checkCampGroundOwnership, (req, res) => {
    //Find and update the correct campground
    CampGround.findByIdAndUpdate(req.params.id, req.body.campground, (err, updatedCampGround) => {
        if(err) {
            console.log(err);
        } else {
            req.flash("success", "Aaawww Yeah!! Campground successfully updated!");
            res.redirect(`/campgrounds/${updatedCampGround._id}`);
        }
    });
});


//DESTROY CAMPGROUND
router.delete("/:id", middleware.checkCampGroundOwnership, (req, res) => {
  CampGround.findByIdAndRemove(req.params.id, (err) => {
    if(err) {
        res.redirect("/campgrounds");
    }   else {
        req.flash("info", "Alright - your campground has been successfully deleted! Why not create another one?");
        res.redirect("/campgrounds");
    }
  }); 
});


module.exports = router;
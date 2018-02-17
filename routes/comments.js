const express           = require("express"),
      router            = express.Router()
      CampGround        = require("../models/campground"),
      Comment           = require("../models/comment"),
      isLoggedIn        = require("../middleware/loggedIn");




//============================
//COMMENTS ROUTES
//============================

// NEW campgrounds/:id/comments/new GET
router.get("/campgrounds/:id/comments/new", isLoggedIn, (req, res) => {
    //Find the campground id
    CampGround.findById(req.params.id, (err, campground) => {
        if (err) {
            console.log(err);
        } else {
            res.render("comments/new", { campground: campground });
        }
    });

});

// CREATE campgrounds/:id/comments POST
router.post('/campgrounds/:id/comments', isLoggedIn, (req, res) => {
    //lookup the campground using id
    CampGround.findById(req.params.id, (err, campground) => {
        if (err) {
            console.log(err);
            res.redirect("/campgrounds");
        } else {
            //Create new comment
            Comment.create(req.body.comment, (err, newComment) => {
                if (err) {
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

module.exports = router;
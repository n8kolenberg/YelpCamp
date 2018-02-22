  const express 				= require("express"),
    	router 					= express.Router(),
    	CampGround				= require("../models/campground"),
    	Comment 				= require("../models/comment"),
        isLoggedIn 				= require("../middleware/loggedIn")
        checkCommentOwnership   = require("../middleware/checkCommentOwnership");


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
            res.render("comments/new", {
                campground: campground
            });
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
                    //Add username and id to comment
                    //comment.author.id and comment.author.username are defined in the Comment model in /models/comment.js
                    newComment.author.id = req.user._id;
                    newComment.author.username = req.user.username;
                    //save comment
                    newComment.save();

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


//EDIT ROUTE FOR COMMENTS - Get the campground_id and comment_id from the route
//Then render the form page with the comment data
router.get("/campgrounds/:id/comments/:comment_id/edit", checkCommentOwnership, (req, res) => {
    //we need to find the comment with the id
    Comment.findById(req.params.comment_id, (err, foundComment) => {
        if (err) {
            console.log(err);
            res.redirect("back");
        } else {
            res.render("comments/edit", {
                comment: foundComment,
                //We only need the campground id for this route
                //And since it's stored in req.params.id, we can simply use that
                //Instead of finding the whole campground in the database first
                campground_id: req.params.id
            });
        }
    });
});

//UPDATE COMMENT
router.put("/campgrounds/:id/comments/:comment_id", checkCommentOwnership, (req, res) => {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, (err, updatedComment) => {
        if (err) {
            console.log(err);
            res.redirect("back");
        } else {
            res.redirect(`/campgrounds/${req.params.id}`);
        }
    })
});

//DESTROY ROUTE
router.delete("/campgrounds/:id/comments/:comment_id", checkCommentOwnership, (req, res) => {
	Comment.findByIdAndRemove(req.params.comment_id, (err) => {
		if (err) {
			console.log(err);
			res.redirect("back");
		}	else {
			res.redirect(`/campgrounds/${req.params.id}`);
		}
	});

});

module.exports = router;
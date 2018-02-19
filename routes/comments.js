const express           = require("express"),
      router            = express.Router(),
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


//EDIT ROUTE FOR COMMENTS
// router.get("/campgrounds/:id/comments/:commentid/edit", (req, res) => {
//   CampGround.findById(req.params.id, (err, campground) => {
//      if(err) {
//          console.log(err);
//          res.redirect("back");
//      } else {
//         //we need to find the comment with the id
//         Comment.findById(req.params.commentid, (err, comment) => {
//            if(err) {
//                console.log(err);
//                res.redirect("back");
//            } else {
//                res.render("/comments/edit", {comment: comment});
//            }
//         });
//      }
//   });  
// });

router.get("/comments/:id/edit", (req, res) => {
   Comment.findById(req.params.id, (err, comment) => {
       if(err) {
           console.log(err);
           res.redirect("back");
       } else {
        res.render("comments/edit", {comment: comment});
       }
   });  
});



//UPDATE COMMENT
router.put("/comments/:id", (req, res) => {
   Comment.findByIdAndUpdate(req.params.id, req.body.comment, (err, comment) => {
       if(err) {
           console.log(err);
           res.redirect("back");
       } else {
           res.redirect("../campgrounds/campgrounds");
       }
   }) 
});



module.exports = router;
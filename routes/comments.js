  const express = require("express"),
        router = express.Router(),
        CampGround = require("../models/campground"),
        Comment = require("../models/comment"),
      //Because we called our middleware file index.js, we don't need to specify it in the 
      //require statement. Index.js is a special name where unless otherwise named, the program
      //will always look for a file named index.js - see nodemodules/express folder as an example
      //We don't define a name, but it will be looking for nodemodules/express/index.js
        middleware = require("../middleware");
  // isLoggedIn 				= require("../middleware/loggedIn"),
  // checkCommentOwnership   = require("../middleware/checkCommentOwnership");


  //============================
  //COMMENTS ROUTES
  //============================

  // NEW campgrounds/:id/comments/new GET
  router.get("/campgrounds/:id/comments/new", middleware.isLoggedIn, (req, res) => {
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
  router.post('/campgrounds/:id/comments', middleware.isLoggedIn, (req, res) => {
      //lookup the campground using id
      CampGround.findById(req.params.id, (err, campground) => {
          if (err) {
              console.log(err);
              req.flash("error", "Woops! Now that's embarrassing... We couldn't find that campground in our database. Maybe try again later?");
              res.redirect("/campgrounds");
          } else {
              //Create new comment
              Comment.create(req.body.comment, (err, newComment) => {
                  if (err) {
                      req.flash("error", "Oh crappydoo! Something unfortunately went wrong with creating your comment. Please try again in a bit!");
                      console.log(err);
                      res.redirect("back");
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
                      req.flash("success", `Wicked! Thanks for adding a comment to this campground, ${req.user.username}!`);
                      //Redirect back to campground show page
                      res.redirect(`/campgrounds/${campground._id}`);
                  }
              }); //End Comment.create()
          } //End else statement
      }); //End Campground.findById()
  }); //End app.get()


  //EDIT ROUTE FOR COMMENTS - Get the campground_id and comment_id from the route
  //Then render the form page with the comment data
  router.get("/campgrounds/:id/comments/:comment_id/edit", middleware.checkCommentOwnership, (req, res) => {
      CampGround.findById(req.params.id, (err, foundCampGround) => {
          //If there's an error or the campground wasn't found, i.e. db returns null (!null = true)
          if (err || !foundCampGround) {
              req.flash("error", "Aww snap! Campground not found!");
              res.redirect("/campgrounds");
          } else {
              //we need to find the comment with the id
              Comment.findById(req.params.comment_id, (err, foundComment) => {
                  if (err) {
                      req.flash("error", "Woops! Something went wrong with finding that particular comment in the database...");
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
          }
      });
  });

  //UPDATE COMMENT
  router.put("/campgrounds/:id/comments/:comment_id", middleware.checkCommentOwnership, (req, res) => {
      Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, (err, updatedComment) => {
          if (err) {
              console.log(err);
              req.flash("error", "Woops! Something went wrong with updating the comment...");
              res.redirect("back");
          } else {
              req.flash("success", "Aaww yeah! Your comment has been updated!");
              res.redirect(`/campgrounds/${req.params.id}`);
          }
      })
  });

  //DESTROY ROUTE
  router.delete("/campgrounds/:id/comments/:comment_id", middleware.checkCommentOwnership, (req, res) => {
      Comment.findByIdAndRemove(req.params.comment_id, (err) => {
          if (err) {
              console.log(err);
              req.flash("error", "Woops - something went wrong with finding this comment in the database...");
              res.redirect("back");
          } else {
              req.flash("info", "Ok - your comment has been successfully removed.");
              res.redirect(`/campgrounds/${req.params.id}`);
          }
      });

  });

  module.exports = router;
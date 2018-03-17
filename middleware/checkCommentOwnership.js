const CampGround = require("../models/campground"),
      Comment    = require("../models/comment");

function checkCommentOwnership(req, res, next) {
    //Is user logged in? 
    if (req.isAuthenticated()) {
        //We're looking for the comment so we can show its info
        //inside of the edit form inputs
        Comment.findById(req.params.comment_id, (err, foundComment) => {
            if (err) {
                console.log(err);
                res.redirect("back");
            } else {
                //Does user own comment?
                /* In the following line, I couldn't compare foundComment.author.id === req.user._id (currently logged in user)
                because the former is a Mongoose object and not a string like the second one
                That's why Mongoose has a method 'equals' to compare */
                if (foundComment.author.id.equals(req.user._id)) {
                    next();
                } else {
                    res.redirect("/login");
                }

            }
        });
    } else {
        res.redirect("/login");
    }
}

module.exports = checkCommentOwnership;
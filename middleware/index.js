const CampGround = require("../models/campground"),
      Comment    = require("../models/comment");

//All the middleware goes in here
const middlewareObj = {};


middlewareObj.isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    //This line doesn't display anything for us
    //It gives us the capability of accessing this flash message on the next request by using req.flash("error")
    //It needs to be handled in the login route and login view
    //This line has to be put in BEFORE we redirect otherwise it won't work
    req.flash("error", "Please login first");
    res.redirect("/login");
}


middlewareObj.checkCampGroundOwnership = (req, res, next) => {
    //Is user logged in? 
    if (req.isAuthenticated()) {
        //We're looking for the campground so we can show its info
        //inside of the edit form inputs
        CampGround.findById(req.params.id, (err, foundCampGround) => {
            //If there's an error or the campground doesn't exist, i.e. the db returns null and !null = true
            if (err || !foundCampGround) {
                console.log(err);
                req.flash("error", "Wooops! Seems like we couldn't find that campground in the database. Maybe try again later?")
                res.redirect("back");
            } else {
                //Does user own campground?
                /* In the following line, I couldn't compare fCG.author.id === req.user._id (currently logged in user)
                because the former is a Mongoose object and not a string like the second one
                That's why Mongoose has a method 'equals' to compare */
                if (foundCampGround.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that!");
                    res.redirect("back");
                } //End inner if
            } //End outer if
        });
    } else {
        req.flash("error", "You need to be logged in to do that!");        
        res.redirect("back");
    }
}


middlewareObj.checkCommentOwnership = (req, res, next) => {
    //Is user logged in? 
    if (req.isAuthenticated()) {
        //We're looking for the comment so we can show its info
        //inside of the edit form inputs
        Comment.findById(req.params.comment_id, (err, foundComment) => {
            //if there's an error or the comment doesn't exist i.e. the db returns null (!null = true)
            if (err || !foundComment) {
                console.log(err);
                req.flash("error", "Wooops! Seems like we couldn't find that comment you were trying to edit. Maybe try again?")                
                res.redirect("back");
            } else {
                //Does user own comment?
                /* In the following line, I couldn't compare foundComment.author.id === req.user._id (currently logged in user)
                because the former is a Mongoose object and not a string like the second one
                That's why Mongoose has a method 'equals' to compare */
                if (foundComment.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that!");
                    res.redirect("/login");
                } //End inner if
            } //End outer if
        });
    } else {
        req.flash("error", "You need to be logged in to do that!");
        res.redirect("/login");
    }
}




module.exports = middlewareObj;
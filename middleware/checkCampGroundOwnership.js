const CampGround = require("../models/campground")

function checkCampGroundOwnership(req, res, next) {
    //Is user logged in? 
    if (req.isAuthenticated()) {
    //We're looking for the campground so we can show its info
    //inside of the edit form inputs
        CampGround.findById(req.params.id, (err, foundCampGround) => {
            if (err) {
                console.log(err);
                res.redirect("back");
            } else {
                //Does user own campground?
                /* In the following line, I couldn't compare fCG.author.id === req.user._id (currently logged in user)
                because the former is a Mongoose object and not a string like the second one
                That's why Mongoose has a method 'equals' to compare */
                if (foundCampGround.author.id.equals(req.user._id)) {
                    next();
                } else {
                    res.redirect("back");
                }

            }
        });
    } else {
        res.redirect("back");
    }
}

module.exports = checkCampGroundOwnership;
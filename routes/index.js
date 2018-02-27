const express       = require("express"),
      router        = express.Router({mergeParams: true}),
      passport      = require("passport"),
      CampGround    = require("../models/campground"),   
      User          = require("../models/user");

router.get('/', (req, res) => {
    res.render("landing");
});

/* ======================================
   AUTH ROUTES
   ====================================== */
//Show the register form
router.get("/register", (req, res) => {
    res.render("register", {page: "register"});
});

//Handle sign up logic
router.post("/register", (req, res) => {
    let newUser = new User({
        username: req.body.username,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        avatar: req.body.avatar,
        email: req.body.email
    });

    User.register(newUser, req.body.password, (err, user) => {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("/register");
        }
        passport.authenticate("local")(req, res, () => {
            req.flash("success", `Successfully Signed Up! Welcome to YelpCamp, ${user.username}!` );
            res.redirect("/campgrounds");
        });
    });
});

//Show the login form
router.get("/login", (req, res) => {
    res.render("login", {page: "login"});
});

//Handle the login logic
router.post("/login", passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
}), (req, res) => { });



//Logout routes
router.get("/logout", (req, res) => {
    // console.log(req.user);
    req.logout();
    req.flash("success", "Logged you out!");
    res.redirect("/campgrounds");
});


//User Profile
router.get("/users/:id", (req, res) => {
    User.findById(req.params.id, (err, foundUser) => {
        if(err) {
            req.flash("error", "Woops! We had some trouble with finding that user...");
            res.redirect("back");
        } else {
            CampGround.find().where('author.id').equals(foundUser._id).exec((err, campgrounds) => {
                if(err) {
                    req.flash("error", "Woops! Someting went wrong...");
                    res.redirect("back");
                } else {
                    res.render("users/show", { user: foundUser, campgrounds: campgrounds });
                }         
            });
            
        }
    })
});

module.exports = router;
const express       = require("express"),
      router        = express.Router({mergeParams: true}),
      passport      = require("passport"),
      User          = require("../models/user");

router.get('/', (req, res) => {
    res.render("landing");
});

/* ======================================
   AUTH ROUTES
   ====================================== */
//Show the register form
router.get("/register", (req, res) => {
    res.render("register");
});

//Handle sign up logic
router.post("/register", (req, res) => {
    let newUser = new User({
        username: req.body.username
    });
    User.register(newUser, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, () => {
            res.redirect("/campgrounds");
        });
    });
});

//Show the login form
router.get("/login", (req, res) => {
    res.render("login");
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
    res.redirect("/campgrounds");
});

module.exports = router;
const express       = require("express"),
      router        = express.Router({mergeParams: true}),
      passport      = require("passport"),
      CampGround    = require("../models/campground"),   
      User          = require("../models/user"),
      nodemailer    = require("nodemailer"),
      async         = require("async"),
      crypto        = require("crypto"), //This one comes with Express so you don't have to install it
      //The following is data for sending reset password emails through mailgun
      api_key       = "key-8d2a840eb1b275bb2ec15ec6280dd48b",
      domain        = "sandbox4a8684bd307f48fbbd154e2f2da15372.mailgun.org",
      mailgun       = require('mailgun-js')({ apiKey: api_key, domain: domain });





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
            req.flash("success", `Welcome to YelpCamp, ${user.username}!` );
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
}), (req, res) => {});



//Logout routes
router.get("/logout", (req, res) => {
    // console.log(req.user);
    req.logout();
    req.flash("success", "See you later!");
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
    });
});


//FORGOT PASSWORD FORM
router.get("/forgot", (req, res)=>{
    res.render("users/forgot");
});

//FORGOT PASSWORD LOGIC
router.post("/forgot", (req, res, next)=>{
    async.waterfall([
        /*First functtion*/
        (done) => {
            crypto.randomBytes(20, (err, buf)=>{
               let token = buf.toString("hex");
               done(err, token);
            });
        },
        /*Second functtion*/
        (token, done) => {
            User.findOne({ email: req.body.email }, (err, user) => {
                if(err || !user) {
                    // eval(require('locus'));
                    req.flash("error", "No user with that email address exists.");
                    return res.redirect("back");
                }
                //Setting the token of the user equal to the
                //token set by crypto
                user.resetPasswordToken = token;
                //Password reset token expires in 30 minutes
                user.resetPasswordExpires = Date.now() + 1800000 
                user.save((err) => {
                    done(err, token, user);
                });
            });
        },
        /*Third functtion*/
        (token, user, done) => {
            /**Using Nodemailer with Mailtrap to test reset password email */
            // let smtpTransport = nodemailer.createTransport({
            //     host: "smtp.mailtrap.io",
            //     port: 2525,
            //     auth: {
            //         user: "3c081cbac4d8bf",
            //         pass: "c8731cc1644a00"
            //     }
            // });

            let maildata = {
                from: 'N8 at YelpCamp <nkolenberg@gmail.com>',
                to: user.email,
                subject: 'YelpCamp Password Reset',
                text: `
You are receiving this because you (or someone else) have requested the reset of the password for your account.
                
Please click on the following link, or paste this into your browser to complete the process:
http://${req.headers.host}/reset/${token}

If you did not request this, please ignore this email and your password will remain unchanged 
                `
            };

            /**Using Nodemailer with Mailtrap to test reset password email */
            // smtpTransport.sendMail(maildata, (err) => {
            //     if(err) {
            //         console.log("Error sending the email");
            //         req.flash("error", "Error sending the email. Please try again.");
            //         req.redirect("back");
            //     }
            //     console.log("mail sent");
            //     req.flash("success", `An email has been sent to ${user.email} with further instructions`);
            //     done(err, "done");    
            // });


         /**Using Mailgun to test reset password email */
            mailgun.messages().send(maildata, (err, body) => {
                if(err) {
                    console.log(err);
                }
                console.log("Password reset email sent");
                req.flash("success", `An email has been sent to ${user.email} with further instructions`);
                done(err, "done");
            });
        }], 
        (err) => {
        if (err) return next(err);
        res.redirect("/forgot");
    });
});



//RESET TOKEN URL in EMAIL
router.get("/reset/:token", (req, res) => {
    //Find the user with the token that has been set on them when they asked for a pw reset
    //and where the resetPassword token expires with a time greater than right now
   User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: {$gt: Date.now() }}, 
    (err, user) => {
       if(err || !user) {
           req.flash("error", "Password token is invalid or has expired");
           return res.redirect("/forgot");
       }
       //RENDER CREATE NEW PASSWORD FORM
       res.render("users/reset", {token : req.params.token});
   });
});


//RESET PASSWORD LOGIC
router.post("/reset/:token", (req, res) => {
    async.waterfall([
        /**First function */
        (done) => {
          User.findOne({resetPasswordToken: req.params.token, resetPasswordToken: {$gt: Date.now()}},
            (err, user) => {
                if(err || !user) {
                    req.flash("error", "Password reset token is invalid or has expired.");
                    return res.redirect("back");
                }
                if(req.body.password === req.body.confirm) {
                    user.setPassword(req.body.password, (err) => {
                        if(err) {
                            req.flash("error", "Passwords do not match");
                            return res.redirect("back");
                        }
                        //Setting these back to undefined as we don't need them anymore
                        user.resetPasswordExpires = undefined;
                        user.resetPasswordToken = undefined;

                        user.save((err) => {
                            req.logIn(user, (err) => {
                                if(err) {
                                    req.flash("error", "Error saving new password in database");
                                    return res.redirect("back");
                                }
                                done(err, user);
                            });
                        });  
                    });
                } else {
                    req.flash("error", "Passwords do not match.");
                    return res.redirect('back');
                }
            });  
        },
        /**Second function */
        (user, done) => {
            let maildata = {
                from: 'N8 at YelpCamp <nkolenberg@gmail.com>',
                to: user.email,
                subject: 'Your YelpCamp password has been changed',
                text: `
Hi ${user.firstName},

This is a confirmation that the password for your account - ${user.email} has just been changed. 


Happy Camping!

Your friend N8 at YelpCamp       

`
            };
            
            mailgun.messages().send(maildata, (err, body) => {
                if (err) {
                    console.log(err);
                }
                console.log("Success mail sent");
                req.flash("success", `Password updated successfully!`);
                done(err, "done");
            });
        }],
    (err) => {
        if(err) {
            console.log(err);
        }
        res.redirect("/campgrounds");
    }
    );
});




module.exports = router;
const express       = require("express"),
      router        = express.Router({mergeParams: true}),
      passport      = require("passport"),
      CampGround    = require("../models/campground"),   
      User          = require("../models/user"),
      nodemailer    = require("nodemailer"),
      async         = require("async"),
      crypto        = require("crypto"), //This one comes with Express so you don't have to install it
      //The following is data for sending reset password emails through mailgun
      api_key       = process.env.mailgun_api_key,
      domain        = process.env.mailgun_domain,
      //Image upload
      multer        = require("multer"),
      mailgun       = require('mailgun-js')({ apiKey: api_key, domain: domain });

      //Express-validation http://tinyurl.com/ybpgyt76
const { check, validationResult, body } = require('express-validator/check');
const { matchedData, sanitize, sanitizeBody } = require('express-validator/filter');




/* ======================================
   IMAGE UPLOAD CONFIG
   ====================================== */
//Define a name for the image file you will upload that will consist of the date + original file name
var storage = multer.diskStorage({
    filename: function(req, file, callback) {
        callback(null, Date.now() + file.originalname);
    }
});

//Any image that gets uploaded must have an extension of jpg, jpeg, png or gif
var imageFilter = function(req, file, cb) {
    //accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error("Only image files are allowed!"), false);
    }
    cb(null, true);
};

//Uploading to cloudinary
var upload = multer({storage: storage, fileFilter: imageFilter});

var cloudinary = require("cloudinary");
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})
/* ======================================
   END IMAGE UPLOAD CONFIG */




router.get('/', (req, res) => {
    res.render("landing");
});

/* ======================================
   AUTH ROUTES
   ====================================== */
/** SHOW THE REGISTER FORM ======= */
router.get("/register", (req, res) => {
    res.render("register", {page: "register"});
});

/** HANDLE THE SIGN UP LOGIC ======= */
router.post("/register", /*Validation middleware*/[
    body("email").isEmail().withMessage("Please fill in a valid email address").trim().normalizeEmail()
    .custom((value, {req}) => {
        //Checking to see if another user already signed up with the same email address
        return User.findOne({email: value}).then(user => {
            //if the user is not null, i.e. the user already exists
            //it translates to !(!null = true) = false
            if(!(!user)) {
                throw new Error(`${value} is already in use`);
            }
         })
    }),
    body("username", "A username of at least 3 characters is required").isLength({min: 3})
    .custom((value, {req}) => {
        //Checking to see if another user already signed up with the same username
        return User.findOne({username: value}).then(user => {
            //if the user is not null, i.e. the user already exists
            //it translates to !(!null = true) = false
            if (!(!user)) {
                throw new Error(`${value} is already in use`);
            }
        });
    }),
    body("password", "Passwords should be at least 5 characters long and contain one number.")
    .isLength({min: 5})
    .matches(/\d/)
], /*Trimming the email*/sanitizeBody("email").trim(), (req, res) => {
    //Get the validation errors 
    const errors = validationResult(req);
    //If there are errors
    if (!errors.isEmpty()) {
        //First, let's deconstruct them into an object for each validation we're checking
        let {email, username, password} = errors.mapped();

        //We create an array to store the flash messages
        let errorArr = [email, username, password];
        let errorMsg = []; //This array will contain the specific error messages
        errorArr.forEach((err, i) => {
            if(err !== undefined) {
                errorMsg.push(err.msg);
            }
        });
        eval(require("locus"));
        
        //And then we flash them  
        req.flash("error", errorMsg);
        return res.redirect("back");
    }
    
    //Image upload
    cloudinary.v2.uploader.upload(req.file.path, (err, result) => {
        if(err) {
            req.flash('error', err.message);
            return res.redirect("back");
        }

        //add cloudinary url for the image to the user object as image property
        req.body.user.image = result.secure_url;
        //add image's public_id to user object
        req.body.user.image_id = result.public_id;
        
        // matchedData returns only the subset of data validated by the middleware
        let newUser = matchedData(req);
        newUser.firstName = req.body.firstName;
        newUser.lastName = req.body.lastName;
        

        User.register(newUser, req.body.password, (err, user) => {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("/register");
            }
            passport.authenticate("local")(req, res, () => {
                req.flash("success", `Welcome to YelpCamp, ${user.username}!`);
                res.redirect("/campgrounds");
            }); //End passport.authenticate()
        }); //End User.register
    }); //End cloudinary.uploader.upload()
}) //End post route;

/** SHOW THE LOGIN FORM ======= */
router.get("/login", (req, res) => {
    res.render("login", {page: "login"});
});

/** HANDLE THE LOGIN LOGIC ======= */
router.post("/login", passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
}), (req, res) => {
});



/** THE LOGOUT ROUTE ======= */
router.get("/logout", (req, res) => {
    // console.log(req.user);
    req.logout();
    req.flash("success", "See you later!");
    res.redirect("/campgrounds");
});


/** SHOW THE USER PROFILE ======= */
router.get("/users/:id", (req, res) => {
    User.findById(req.params.id, (err, foundUser) => {
        if(err || !foundUser) {
            req.flash("error", "Woops! Unfortunately, that user doesn't seem to exist anymore");
            res.redirect("/campgrounds");
        } else {
            CampGround.find({}, null, {sort: {"createdAt": -1}}).where('author.id').equals(foundUser._id).exec((err, campgrounds) => {
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


/** SHOW THE FORGOT PASSWORD FORM ======= */
router.get("/forgot", (req, res)=>{
    res.render("users/forgot");
});

/** FORGOT PASSWORD LOGIC ======= */
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


/** RESET TOKEN URL IN EMAIL ======= */
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


/** RESET PASSWORD LOGIC ======= */
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
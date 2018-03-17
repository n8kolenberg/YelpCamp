const express = require("express"),
    router = express.Router({
        mergeParams: true
    }),
    request = require("request"),
    CampGround = require("../models/campground"),
    //   isLoggedIn                = require("../middleware/loggedIn"),
    //   checkCampGroundOwnership  = require("../middleware/checkCampGroundOwnership"),
    //Because we called our middleware file index.js, we don't need to specify it in the 
    //require statement. Index.js is a special name where unless otherwise named, the program
    //will always look for a file named index.js - see nodemodules/express folder as an example
    //We don't define a name, but it will be looking for nodemodules/express/index.js
    middleware = require("../middleware"),


    //Image upload configuration
    multer = require("multer");
    //Define a name for the image file you will upload that consists of the date + original file name    
    // storage = multer.diskStorage({
    //     filename: function (req, file, callback) {
    //         callback(null, Date.now() + file.originalname);
    //     }
    // });

//     //Any image that gets uploaded via the form must have an extension of
//     //jpg, jpeg, png or gif
//     imageFilter = (req, file, cb) => {
//         // accept image files only
//         if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
//             return cb(new Error('Only image files are allowed!'), false);
//         }
//         cb(null, true);
//     },

//     upload = multer({
//         storage: storage,
//         fileFilter: imageFilter
//     });



var storage = multer.diskStorage({
    filename: function(req, file, callback) {
      callback(null, Date.now() + file.originalname);
    }
  });
  var imageFilter = function (req, file, cb) {
      // accept image files only
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
          return cb(new Error('Only image files are allowed!'), false);
      }
      cb(null, true);
  };
  var upload = multer({ storage: storage, fileFilter: imageFilter})
  
  var cloudinary = require('cloudinary');
  cloudinary.config({ 
    cloud_name: 'n8dawg', 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
  });




//ROUTES
router.get("/", (req, res) => {
    let campGrounds = CampGround.find({}, null, {sort: {"createdAt": -1}}, (err, allcampGrounds) => {
        if (err) {
            req.flash("error", err.message);
            res.redirect("back");
        } else {
            res.render('campgrounds/campgrounds', {
                campGrounds: allcampGrounds,
                page: "campgrounds"
            });
        }
    });
});


//This renders a form that allows the below post method to be called
router.get("/new", middleware.isLoggedIn, (req, res) => {
    res.render("campgrounds/new");
});


//Creating and saving a new campGround
router.post("/", middleware.isLoggedIn, upload.single("image"), /*image coming from the form */ (req, res) => {
 
    cloudinary.v2.uploader.upload(req.file.path, (err, result) => {
        if(err) {
            req.flash('error', err.message);
            return res.redirect('back');
          }
        
        // add cloudinary url for the image to the campground object under image property
        req.body.campground.image = result.secure_url;
        //add image's public_id to campground object
        req.body.campground.image_id = result.public_id;
        // add author to campground
        req.body.campground.author = {
            id: req.user._id,
            username: req.user.username
        }

        CampGround.create(req.body.campground, function (err, campground) {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
            res.redirect('/campgrounds/' + campground.id);
        });
    });
});

//GET CAMPGROUND BY ID
router.get('/:id', (req, res) => {
    //Find the campground with provided id
    //Then populate the comments from the ids that are associated with the campGround in ascending order 
    //based on their createdDate
    //Then execute the callback function
    CampGround.findById(req.params.id).populate({ path: "comments", options: {sort: {"createdAt": -1}} }).exec((err, foundCamp) => {
        //If there's an err or there's no foundCamp, i.e. the db returns null (and !null = true)
        if (err || !foundCamp) {
            console.log(err);
            req.flash("error", "Campground not found!");
            res.redirect("back");
        } else {
            res.render("campgrounds/show", {
                foundCamp: foundCamp
            });
        }
    });
});

//EDIT CAMPGROUND FORM
//middleware.checkCampGroundOwnership is a self-made middleware imported from /middleware/index.js
router.get("/:id/edit", middleware.checkCampGroundOwnership, (req, res) => {
    CampGround.findById(req.params.id, (err, foundCampGround) => {
        if (err) {
            console.log(err);
            req.flash("error", "Woops! Now that's embarrassing... We couldn't find that campground in our database. Maybe try again later?");
            res.redirect("back");
        } else {
            res.render("campgrounds/edit", {
                campground: foundCampGround
            });
        }
    });
});

//UPDATE CAMPGROUND 
router.put("/:id/", middleware.checkCampGroundOwnership, upload.single("image"), (req, res) => {

    //If the user uploads a new image.
    if(req.file) {
        CampGround.findById(req.params.id, (err, campground) => {
            if(err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            //We need to delete the currently existing file from cloudinary
            cloudinary.v2.uploader.destroy(campground.image_id, (err, result) => {
                if(err) {
                    req.flash("error", err.message);
                    return res.redirect("back");
                }
            });

            //Upload the new image
            cloudinary.v2.uploader.upload(req.file.path, (err, result) => {
                if(err) {
                    req.flash("error", err.message);
                    return res.redirect("back");
                }
                //Associate the secure url from the file to the campground's image
                campground.image = result.secure_url;
                //Associate the image's public_id to the campground object
                campground.image_id = result.public_id;
                // eval(require("locus"));

                campground.author = {
                    id : req.user._id,
                    username: req.user.username
                }
                CampGround.findByIdAndUpdate(campground._id, campground, (err) => {
                    if(err) {
                        req.flash("error", err.message);
                        return res.redirect("back");
                    }
                    req.flash("success", "You've successfully updated your campground!");
                    res.redirect(`/campgrounds/${campground._id}`);
                })
            });            
        });
        
    }
    else {
        //If the user only updated the text fields of the campgrounds, then we find the campground and update it
        CampGround.findById(req.params.id, req.body.campground, (err, campground) => {
            if(err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            req.flash("success", "You've successfully updated your campground!");
            res.redirect(`/campgrounds/${campground._id}`);
        });
    } 

});


//DESTROY CAMPGROUND
router.delete("/:id", middleware.checkCampGroundOwnership, (req, res) => {
    CampGround.findByIdAndRemove(req.params.id, (err) => {
        if (err) {
            res.redirect("/campgrounds");
        } else {
            req.flash("info", "Alright - your campground has been successfully deleted! Why not create another one?");
            res.redirect("/campgrounds");
        }
    });
});


module.exports = router;
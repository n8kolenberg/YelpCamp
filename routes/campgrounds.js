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

    //Image manipulation https://www.npmjs.com/package/jimp
    Jimp = require("jimp"),
    fs = require("fs"),

    //Image upload configuration
    multer = require("multer");
     
 //Define a name for the image file you will upload that consists of the date + original file name  
var storage = multer.diskStorage({
    filename: function(req, file, callback) {
      callback(null, Date.now() + file.originalname);
    }
  });
  //Any image that gets uploaded via the form must have an extension of
  //jpg, jpeg, png or gif
  var imageFilter = function (req, file, cb) {
      // accept image files only
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
          return cb(new Error('Only image files are allowed!'), false);
      }

      cb(null, true);
  };
  var upload = multer({ storage: storage, fileFilter: imageFilter});
  
  var cloudinary = require('cloudinary');
  cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
  });


//Cleaning form request data with regular expression
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};



//ROUTES
router.get("/", (req, res) => {
    //If the user searched for a campground
    if(req.query.search) {
        //clean up the search query
        const regex = new RegExp(escapeRegex(req.query.search), "gi");
        //find the campground based on the name the user typed in
        CampGround.find({name: regex}, null, {sort: {"createdAt": -1}}, (err, allCampGrounds) => {
            if(err) {
                req.flash("error", err.message);
                return res.redirect("back");
            } else {
                //If we couldn't find the name the user searched for
                if(allCampGrounds.length < 1) {
                    //Notify them
                    req.flash("error", "We couldn't find any campground with that name");
                    //And redirect them back
                    return res.redirect("back");
                    }
                    //Otherwise, show them the campgrounds related to their search
                res.render("campgrounds/campgrounds", {
                    campGrounds: allCampGrounds,
                    query: req.query.search,
                    page: "campgrounds"
                }); //End res.render()
            } //End else {}
        });//End CampGround.find()
    } else {
        CampGround.find({}, null, { sort: { "createdAt": -1 } }, (err, allcampGrounds) => {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            } else {
                res.render('campgrounds/campgrounds', {
                    campGrounds: allcampGrounds,
                    query: null,
                    page: "campgrounds"
                });
            }
        });
    }
});



//This renders a form that allows the below post method to be called
router.get("/new", middleware.isLoggedIn, (req, res) => {
    res.render("campgrounds/new");
});


//Creating and saving a new campGround
router.post("/", middleware.isLoggedIn, upload.single("image"), /*image name coming from the form */ (req, res) => {

    //Use Jimp to read image path
    Jimp.read(req.file.path, (err, img) => {
        if (err) {
            req.flash("error", err.message);
            res.redirect("back");
        }
        //Manipulate the image
        img.resize(Jimp.AUTO, 400)
            .quality(100)
            //Then save it in the req.file.path
            .write(req.file.path, err => {
                if(err) {
                    console.log(err);
                }
                // Then upload the manipulated image
                cloudinary.v2.uploader.upload(req.file.path, (err, result) => {
                    if (err) {
                        req.flash('error', `This is the upload issue: ${err.message}`);
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
                    }); //End CampGround.create()
                }); //End cloudinary.uploader.upload()
            }); //End img.write()
    }); //End Jimp.read()
}); //End router.post()


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
            req.flash("error", "Woops! Now that's embarrassing... We couldn't find that campground.");
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
                req.flash("error", `This is the problem with finding the campground: ${err.message}`);
                return res.redirect("back");
            }
            //We need to delete the currently existing file from cloudinary
            cloudinary.v2.uploader.destroy(campground.image_id, (err, result) => {
                if(err) {
                    req.flash("error", `This is the problem with cloudinary destroying the image: ${err.message}`);
                    return res.redirect("back");
                }
            }); //End cloudinary.v2.uploader.destroy

            Jimp.read(req.file.path, (err, img) => {
                if(err) {
                    req.flash("error", err.message);
                    res.redirect("back");
                }
                //Manipulate the image
                img.resize(Jimp.AUTO, 600)
                .quality(100)
                //Then save it in the req.file.path
                .write(req.file.path, err => {
                    if(err) {
                        console.log(err);
                    }
                    //Then upload the manipulated image
                    cloudinary.v2.uploader.upload(req.file.path, (err, result) => {
                       if(err) {
                           req.flash("error", err.message);
                           return res.redirect("back");
                       } 
                        // add cloudinary url for the image to the campground object under image property
                        req.body.campground.image = result.secure_url;
                        //add image's public_id to campground object
                        req.body.campground.image_id = result.public_id;
                        // add author to campground
                        req.body.campground.author = {
                            id: req.user._id,
                            username: req.user.username
                        };
                        //Now we find the same campground again and we update what the user added
                        CampGround.findByIdAndUpdate(req.params.id, req.body.campground, (err, campground) => {
                            if(err) {
                                req.flash("error", `There was an error updating your campground: ${err.message}`);
                                return res.redirect("back");
                            }
                            req.flash("success", "You've successfully updated your campground!");
                            res.redirect(`/campgrounds/${campground._id}`);

                        });//End Campground.findByIdAndUpdate
                    });

                })//End img.write()
            });//End Jimp.read()
          
        }); //End Campground.findById()
        
    }
    else {
        //If the user only updated the text fields of the campgrounds, then we find the campground and update it
        CampGround.findByIdAndUpdate(req.params.id, req.body.campground, (err, campground) => {

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
    CampGround.findById(req.params.id, (err, campground) => {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        //We need to delete the currently existing file from cloudinary
        cloudinary.v2.uploader.destroy(campground.image_id, (err, result) => {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
        });
        campground.remove();
        req.flash("info", "Alright - your campground has been successfully deleted! Why not create another one?");
        res.redirect("/campgrounds"); 
    });
});


module.exports = router;
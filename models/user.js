const mongoose              = require("mongoose"),
      passportLocalMongoose = require("passport-local-mongoose");

let userSchema = new mongoose.Schema({
    password: { type: String },
    username: {
        type: String,
        unique: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },

    local: {    
        avatar: { type: String },
        firstName: String,
        lastName: String,     
    },
    
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    facebook: {
        id: String,
        token: String,
        email: String,
        name: String,
    }
});


userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
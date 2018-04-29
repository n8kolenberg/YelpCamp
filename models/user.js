const mongoose              = require("mongoose"),
      passportLocalMongoose = require("passport-local-mongoose");

let userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: {type: String},
    avatar: { type: String, default: "https://goo.gl/FHhKVq"},
    firstName: String,
    lastName: String,
    email: {type: String, unique: true, required: true},
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
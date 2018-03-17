const mongoose              = require("mongoose"),
      passportLocalMongoose = require("passport-local-mongoose");

let userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: {type: String, required: true},
    avatar: { type: String, default: "https://goo.gl/FHhKVq"},
    firstName: String,
    lastName: String,
    email: {type: String, unique: true, required: true},
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isAdmin: {type: Boolean, default: false}
});


userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
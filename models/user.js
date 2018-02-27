const mongoose              = require("mongoose"),
      passportLocalMongoose = require("passport-local-mongoose");

let userSchema = new mongoose.Schema({
    username: String,
    password: String,
    avatar: { type: String, default: "https://goo.gl/FHhKVq"},
    firstName: String,
    lastName: String,
    email: String,
    isAdmin: {type: Boolean, default: false}
});


userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
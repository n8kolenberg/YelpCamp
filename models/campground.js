const mongoose = require("mongoose");

let campGroundSchema = new mongoose.Schema({
    name: String,
    image: String,
    description: String,
    comments: [
        {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }
]
});
//Define the model
module.exports = mongoose.model('CampGround', campGroundSchema);
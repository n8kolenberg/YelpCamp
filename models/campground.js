const mongoose = require("mongoose");

let campGroundSchema = new mongoose.Schema({
    name: String,
    price: String,
    image: String,
<<<<<<< HEAD
=======
    image_id: String,
>>>>>>> 814d2857600aa433b25e85e9f9260d851e62397e
    description: String,
    comments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment"
    }],

    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        username: String
    },
    createdAt: { type: Date, default: Date.now }

});
//Define the model
module.exports = mongoose.model('CampGround', campGroundSchema);
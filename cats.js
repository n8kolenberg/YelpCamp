const mongoose = require('mongoose');
mongoose.connect("mongodb://127.0.0.1/cat_app");


let catSchema = new mongoose.Schema({
    name: String,
    age: Number,
    temperament: String
});

let Cat = mongoose.model("Cat", catSchema);

//Create a new cat and save it to the DB
// let grumpyCat = new Cat({
//     name: "Grouchy Cat",
//     age: 7,
//     temperament: "grouchy"
// });

// grumpyCat.save((err, cat) => {
//     if(err) {
//         console.log("Something went wrong:");
//         console.log(err);
//     } else {
//         console.log("We just saved a cat to the DB: ");
//         console.log(cat);
//     }
// });


Cat.create({
    name: "Mr. Bubbles",
    age: 5,
    temperament: "Evil"
}, (err, cat) => {
    if(err) {
        console.log("Something went wrong with saving our cat to the DB: ");
        console.log(err);
    } else {
        console.log("We saved a cat to our DB: ");
        console.log(cat);
    }
});


//Retrieve all the cats from the DB
Cat.find({}, (err, cats) => {
    if(err) {
        console.log("Something went wrong with finding all cats: ");
        console.log(err);
    } else {
        console.log("All the cats....");
        console.log(cats);
    }
});
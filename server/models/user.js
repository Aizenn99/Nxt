const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    credits: {
        type: Number,
        default: 1500,
    },
})

module.exports = mongoose.model("User", userSchema);


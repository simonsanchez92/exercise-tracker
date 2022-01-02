const mongoose = require("mongoose");

const ExerciseSchema = mongoose.Schema({
  username: String,
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: new Date(Date.now()).toDateString(),
  },
});

module.exports = mongoose.model("Exercise", ExerciseSchema);

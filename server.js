const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const connection = require("./config/db");
connection.once("open", () => console.log("DB Connected!"));
connection.on("error", () => console.log("There has been an error!"));

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static("public"));
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//Import models
const User = require("./models/User");
const Exercise = require("./models/Exercise");
const { count } = require("./models/User");

app.post("/api/users", async (req, res, next) => {
  const username = req.body.username;

  if (username.trim() == "") {
    return res.json({ error: "You must provide a username" });
  }

  try {
    const newUser = new User({
      username: username,
    });

    await newUser.save();

    res.json({
      username: newUser.username,
      _id: newUser._id,
    });
  } catch (err) {
    console.log(err);
  }
});

app.get("/api/users", async (req, res, next) => {
  try {
    const users = await User.find();

    return res.send(users);
  } catch (err) {
    return res.json({
      err: "Internal Server Error",
    });
  }
});

app.post("/api/users/:_id/exercises", async (req, res, next) => {
  const id = req.params._id.trim();

  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.json({ error: `User with id ${id} does not exist...` });
    } else {
      const providedDate = new Date(date);

      let newExercise = {
        username: user.username,
        userId: user._id,
        duration,
        description: description,
      };

      if (providedDate instanceof Date && !isNaN(providedDate)) {
        newExercise.date = providedDate.toDateString();
      }

      await new Exercise(newExercise).save();

      const response = await Exercise.findOne().sort({ _id: -1 });

      return res.json({
        _id: user._id,
        username: user.username,
        date: response.date.toDateString(),
        duration: response.duration,
        description: response.description,
      });
    }
  } catch (err) {
    if (!mongoose.isValidObjectId(id)) {
      return res.json({ objectId: "You must provide a real id" });
    }
    return res.json({ error: "Internal server error" });
  }
});

app.get("/api/users/:_id/logs", async (req, res, next) => {
  const id = req.params._id.trim();

  const { from, to, limit } = req.query;

  try {
    const userFromDB = await User.findById(id);

    if (!userFromDB) {
      return res.json({ error: `User with id ${id} does not exist...` });
    }

    const query = Exercise.find({ userId: userFromDB._id });

    let userExercises;

    if (from) {
      query.find({ date: { $gte: new Date(from) } });
    }

    if (to) {
      query.find({ date: { $lte: new Date(to) } });
    }

    if (limit && parseInt(limit) > 0) {
      query.find().limit(parseInt(limit));
    }

    console.log(query.getFilter());
    userExercises = await query.exec();

    userExercises = userExercises.map((exercice) => {
      const { description, duration } = exercice;
      const date = exercice.date.toDateString();

      return {
        description,
        duration,
        date,
      };
    });

    const count = userExercises.length;

    const user = {
      username: userFromDB.username,
      count: count,
      _id: userFromDB._id,
      log: userExercises,
    };

    return res.send(user);
  } catch (err) {
    if (!mongoose.isValidObjectId(id)) {
      return res.json({ objectId: "You must provide a real id" });
    }
  }
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});

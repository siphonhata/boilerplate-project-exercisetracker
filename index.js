const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let bodyParser = require('body-parser')

let mongoose;
try {
  mongoose = require('mongoose');
} catch (e) {
  console.log(e);
}

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const Schema = mongoose.Schema;

// User Schema
const userSchema = new Schema ({
  username: {type: String, required: true}
})
let userModel = mongoose.model('user', userSchema);

// Exercise Schema
const exerciseSchema = new Schema ({
  userId: {type: String, required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: Date, default: new Date()}
})
let exerciseModel = mongoose.model('exercise', exerciseSchema);


app.use(cors())
app.use(express.static('public'))
app.use("/", bodyParser.urlencoded({ extended: false }));


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post("/api/users", (req,res) => {
  let username = req.body.username;
  let newUser = userModel({username: username});
  newUser.save();
  res.json(newUser);
})

app.get("/api/users", (req,res) => {
  userModel.find({}).then(users => {
    res.json(users);
  })
})

app.post("/api/users/:_id/exercises", (req,res) => {
  console.log(req.body);
  let userId = req.params._id;
  let excerciseObj = {
    userId: userId,
    description: req.body.description,
    duration: req.body.duration
  }
  if(req.body.date != "") {
    excerciseObj.date = req.body.date;
  }

  let newExercise = new exerciseModel(excerciseObj);
  userModel.findById(userId).then(user => {
    newExercise.save().then(exercise => {
      res.json({
        _id: user._id,
        username: user.username,
        date: exercise.date.toDateString(),
        duration: exercise.duration,
        description: exercise.description
      });
    })
  })
});

app.get("/api/users/:_id/logs", (req,res) => {
  let userId = req.params._id;
  let responseObj = {};

  let limitParam = req.query.limit;
  let toParam = req.query.to;
  let fromParam = req.query.from;

  limitParam = limitParam ? parseInt(limitParam) : limitParam;

  let queryObj = {userId: userId};

  if(fromParam || toParam) {
    queryObj.date = {};
    if(fromParam) {
      queryObj.date['$gte'] = fromParam;
    }
    if(toParam) {
      queryObj.date['$lte'] = toParam;
    }
  }

  userModel.findById(userId).then(user => {
    responseObj._id = user._id;
    responseObj.username = user.username;
    exerciseModel.find(queryObj).limit(limitParam).then(exercises => {
      responseObj.count = exercises.length;
      responseObj.log = exercises.map(exercise => {
        return {
          description: exercise.description,
          duration: exercise.duration,
          date: exercise.date.toDateString()
        }
      })
      res.json(responseObj);
    })
  })

});







const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
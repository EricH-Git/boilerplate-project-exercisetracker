const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

  //---------//
  // MY CODE //
  //---------//

const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(bodyParser.urlencoded({ extended: false }));


// Mongodb User Schema
const userSchema = new Schema({
  "username": String,
  "exercises": [{
    "description": String,
    "duration": Number,
    "date": String
  }]
});

const UserModel = mongoose.model('userSchema', userSchema);


// connection test
app.get('/test', (req, res) => {
  res.json({'response': mongoose.connection.readyState});
  
});

// new user
app.post('/api/users', (req, res) => {
  const { username } = req.body;

  const newUser = new UserModel({ 'username': username });
  newUser.save((err, payload) => {
    if(err) { 
      console.log(err);
    } else {
      res.json({'username': username, '_id': payload._id});
    }
  });
});

// get user array
app.get('/api/users', (req,res) => {
  const userArr = UserModel.find({}, (err, payload) => {
  if (err) {
    console.log(err);
  } else {
    res.json(payload.map(user => { return { 'username': user.username, '_id': user._id } }));
  }
  });
});

// new exercise
app.post('/api/users/:_id/exercises', (req, res) => {
  const { description, duration, date } = req.body;
  const _id = req.params._id;

  console.log({'id': _id, 'description': description, 'duration': duration, 'date': date});
  if (!_id) {
    return res.json({ 'error': 'invalid user id'});
  }
  // get username by id
  UserModel.findById(_id, (err, user) => {
    if(err) {
      return res.json({ 'error': err});
    } else {
      console.log(user);

      // test date and or replace date
      let fixedDate;
      const regTest = /\d{4}-\d{2}-\d{2}/;
      
      if (!date) {
        fixedDate = new Date().toDateString();
        console.log('No Date Added, setting current date')
      } else if (!regTest.test(date)) {
        console.lgo('bad date');
        return res.json({'error': 'Invalid Date'});
      } else {
        console.log('date is approved');
        fixedDate = new Date(date).toDateString();
      }

      user.exercises.push({ description: description, duration: duration, date: fixedDate });

      user.save((err, payload) => {
        let newExercise = payload.exercises[payload.exercises.length -1];
        return res.json({
          _id: payload._id,
          username: payload.username,
          description: newExercise.description,
          duration: newExercise.duration,
          date: newExercise.date
        });

      }); 
    }
  });

});

// get exercise array
app.get('/api/users/:_id/logs', (req,res) => {
  
  const { _id } = req.params;
  const { from, to, limit } = req.query;
  // console.log(from,to, limit);
  UserModel.findById(_id, (err, user) => {
      if (err) {
        console.log(err);
      } else {
        let result = user.exercises.map(item => {
          return { description: item.description, duration: item.duration, date: item.date };
        });

        if (from) { result = result.filter(i => new Date(i.date).getTime() >= new Date(from).getTime()) }
        if (to) { result = result.filter(i => new Date(i.date).getTime() <= new Date(to).getTime()) }
        
        const amount = result.length;
        if (limit) { result = result.slice(0, limit) }



        res.json({_id: user._id, username: user.username, count: amount, log: result });



      }
  });

}); 
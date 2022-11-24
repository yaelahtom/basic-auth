require('dotenv').config()
const express = require('express')
const path = require('path')
const session = require('express-session')
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const mongoose = require('mongoose')
const Schema = mongoose.Schema

// url db
const mongoDB = process.env.mongoDB
mongoose.connect(mongoDB, {
  useUnifiedTopology: true,
  useNewUrlParser: true
})
const db = mongoose.connection
db.on('error', console.error.bind(console, 'mongo conn error'))

// define schema
const User = mongoose.model(
  'User',
  new Schema({
    username: { type: String, required: true },
    password: { type: String, required: true }
  })
)

// express
const app = express()
app.set('views', __dirname);
app.set('view engine', 'ejs')

app.use(session({
  secret: 'cats',
  resave: false,
  saveUninitialized: true
}))

// setting up the localStrategy (passport)
passport.use(
  new LocalStrategy((username, password, done) => {
    User.findOne({ username: username }, (err, user) => {
      if (err) {
        return done(err)
      }
      if (!user) {
        return done(null, false, { message: 'incorrect username' })
      }
      if (user.password !== password) {
        return done(null, false, { message: 'incorrect password' })
      }
      return done(null, user)
    })
  })
)

// sessions and serialization
passport.serializeUser(function (user, done) {
  done(null, user.id)
})

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user)
  })
})

// initializes passport
app.use(passport.initialize())
app.use(passport.session())
app.use(express.urlencoded({ extended: false }))

// routes
app.get('/', (req, res) => res.render('index', { user: req.user }))
app.get(`/sign-up`, (req, res) => {
  res.render('sign-up-form')
})

// post method for sign up
app.post('/sign-up', (req, res, next) => {
  const user = new User({
    username: req.body.username,
    password: req.body.password
  }).save(err => {
    if (err) return next(err)
    res.redirect('/')
  })
})

// post method for log in
app.post(
  '/log-in',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/'
  })
)

// method fo r log out
app.get('/log-out', (req, res, next) => {
  req.logout(function (err) {
    err ? next(err) : res.redirect('/')
  })
})

app.listen(3000, () => console.log('app listening on port 3000'))
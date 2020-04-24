var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
/* GET home page. */
router.get('/', function (req, res, next) {
  console.log(req.session)
  // console.log(res.locals.sess.email)
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    const dbo = db.db("poofbook");
    dbo.collection("books").find({}).toArray(function (err, result) {
      if (err) throw err;
      // console.log(result);
      const data = result;
      if (req.query.register != undefined) {
        res.render('index', { register: "true", data });
      } else if (req.query.login != undefined) {
        res.render('index', { login: "true", data });
      } else {
        res.render('index', { data });
      }
      db.close();
    });
  });
 

});

//สมัคร
router.get('/register', function (req, res, next) {
  console.log(req.query.register)
  if (req.query.register == undefined) {
    res.render('register');
  } else {
    res.render('register', { register: "false" });
  }
});

router.post('/register/add', function (req, res, next) {
  const data = req.body;
 console.log(data);
  data.user_stat = 'user';
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("poofbook");
    dbo.collection("users").findOne({ email: req.body.email }, function (err, result) {
      if (err) throw err;
      // console.log(result);
      if (result == null) {
        dbo.collection("users").insertOne(data, function (err, resu) {
          if (err) throw err;
          console.log("users 1 document inserted");
          db.close();
          res.redirect('/?register=true');
        });
      } else {
        db.close();
        res.redirect('/register?register=false');
      }
    });
  });
});
//สมัคร //

//
router.get('/login', function (req, res, next) {
  // console.log(req.query.login)
  if (req.query.login == undefined) {
    res.render('login');
  } else {
    res.render('login', { login: "false" });
  }
});

router.post('/login', function (req, res, next) {
  console.log(req.body)
  MongoClient.connect(url, function (err, db) {
    if (err) throw err;
    var dbo = db.db("poofbook");
    dbo.collection("users").findOne({ email: req.body.email, password: req.body.password }, function (err, result) {
      if (err) throw err;
      console.log(result);
      if (result == null) {
        db.close();
        res.redirect('/login?login=false');
      } else {
        req.session.userid = result._id 
        req.session.email = result.email
        req.session.user_stat = result.user_stat
        req.session.cart = [];
        // req.session.remember = req.body.remember
        db.close();
        res.redirect('/?login=true');
      }
    });
  });
});

router.get('/logout', function (req, res, next) {
  req.session.destroy(function (err) {
    // ลบตัวแปร session ทั้งหมด 
    console.log("logout")
  })
  res.redirect('/')
});


module.exports = router;

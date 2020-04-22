var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.render('contact', { title: 'หนัง-สือ-สู !!!' });
});

module.exports = router;

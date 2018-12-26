var express = require('express');
var router = express.Router();

/* GET register page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'No user logged in', jscript: 'index' });
});

module.exports = router;
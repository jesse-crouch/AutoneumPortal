var express = require('express');
var router = express.Router();
var fs = require('fs');

var url = '';
fs.readFile('serverURL.txt', 'utf8', (err, data) => {
	if (err) console.log(err);
	url = data;
});

/* GET home page. */
router.get('/', function(req, res, next) {
	console.log(url);
  res.render('login', {
	  title: 'Plant Access',
	  jscript: 'login',
	  serverURL: url
  });
});

module.exports = router;

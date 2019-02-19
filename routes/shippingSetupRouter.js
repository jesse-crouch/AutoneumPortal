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
  res.render('shippingSetup', {
	  title: 'No Active Requests',
	  jscript: 'shippingSetup',
	  serverURL: url
  });
});

module.exports = router;

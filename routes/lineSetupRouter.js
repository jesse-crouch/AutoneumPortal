var express = require('express');
var router = express.Router();

/* GET line setup page. */
router.get('/', function(req, res, next) {
  res.render('lineSetup', { title: '', jscript: 'lineSetup' });
});

module.exports = router;
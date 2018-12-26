var express = require('express');
var router = express.Router();

/* GET status page. */
router.get('/', function(req, res, next) {
  res.render('status', { title: 'Material Requests', jscript: 'status' });
});

module.exports = router;
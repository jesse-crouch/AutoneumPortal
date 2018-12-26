var express = require('express');
var router = express.Router();

/* GET shipping page. */
router.get('/', function(req, res, next) {
  res.render('shipping', { title: 'No request selected', jscript: 'shipping' });
});

module.exports = router;
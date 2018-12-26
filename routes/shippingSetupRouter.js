var express = require('express');
var router = express.Router();

/* GET shipping setup page. */
router.get('/', function(req, res, next) {
  res.render('shippingSetup', { title: 'Select a Request', jscript: 'shippingSetup' });
});

module.exports = router;
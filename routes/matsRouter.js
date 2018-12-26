var express = require('express');
var router = express.Router();

/* GET materials page. */
router.get('/', function(req, res, next) {
  res.render('materials', { title: 'Materials', jscript: 'materials' });
});

module.exports = router;
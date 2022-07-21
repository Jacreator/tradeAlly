var express = require('express');

var router = express.Router();

/* GET home page. */
router.get('/welcome', function(req: any, res: any, next: any) {
  res.status(200).json({
    message: 'Welcome to the bills payment',
    service: 'Bills Payment',
    code: 200
  });
});

export default router;

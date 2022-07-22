import express from 'express';

// local files
import airtime from './airtime.route';

var router = express.Router();

/* GET home page. */
router.get('/welcome', function(req: any, res: any, next: any) {
  res.status(200).json({
    message: 'Welcome to the bills payment',
    service: 'Bills Payment',
    statusCode: 200,
  });
});

router.use('/airtime', airtime);

export default router;

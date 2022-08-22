import express from 'express';

// local files
import airtime from './airtime.route';
import beneficiaries from './beneficiaries.route';

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
router.use('/beneficiaries', beneficiaries);

export default router;

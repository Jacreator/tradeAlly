import express from 'express';

// local files
import base from './base';
import account from './account';
import inventory from './inventory';
import sale from './sales';

var router = express.Router();

/* GET home page. */
router.get('/welcome', function(req: any, res: any, next: any) {
  res.status(200).json({
    message: 'Welcome to the TradeAlly Service',
    service: 'TradeAlly Payment',
    statusCode: 200,
  });
});

router.use('/base', base);
router.use('/account', account);
router.use('/inventory', inventory);
router.use('/sales', sale);

export default router;

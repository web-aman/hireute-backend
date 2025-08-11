const express = require("express");
const router = express.Router();
const { paymentIntentWebHook } = require('../controllers/paymentController');
 
router.post("/webhook-item-intent", express.raw({ type: 'application/json' }), paymentIntentWebHook);
 
module.exports = router;
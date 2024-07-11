// const express = require("express");
// const { createOrUpdateFeePayment , getFeeStatus, feeIncomeMonths} = require("../controllers/feeStatusController");
// const verifyToken = require("../middleware/auth");

// const router = express.Router();

// router.post('/createFeeStatus', verifyToken, createOrUpdateFeePayment);
// router.get('/getFeeStatus', verifyToken, getFeeStatus);
// router.get('/feeIncomeMonths', verifyToken, feeIncomeMonths);
// // router.delete('/deleteExam/:examId', verifyToken, deleteExam);
// // router.put('/updateExam', verifyToken, updateExam);

// module.exports = router;

const express = require("express");
const { createOrUpdateFeePayment, getFeeStatus, feeIncomeMonths, getAllFeeStatuses } = require("../controllers/feeStatusController");
const verifyToken = require("../middleware/auth");

const router = express.Router();

router.post('/createFeeStatus', verifyToken, createOrUpdateFeePayment);
router.get('/getFeeStatus', verifyToken, getFeeStatus);
router.get('/feeIncomeMonths', verifyToken, feeIncomeMonths);
router.get('/getAllFeeStatuses', verifyToken, getAllFeeStatuses);

module.exports = router;

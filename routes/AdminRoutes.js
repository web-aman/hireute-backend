const express = require("express");
const router = express.Router();
const {
  login,
  resetPassword,
  changePassword,
  sendForgotPasswordOTP,
  verifyOtp,
  allUte,
  getAllUser,
  updateUserStatus,
  createBlog,
  updateBlog,
  userJobSuspended,
  allJobs,
  blogDetail,
  allBlog,
  createFaq,
  faqList,
  updateFaq,
  faqDetail,
  deleteFaq,
  deleteBlog,
  userJobStatus,
  userUteStatus,
  getQueries,
  replyQueries,
  deleteUte,
  deleteJob,
  getAllBookingList,
  createJobBooking,
  updateJobBooking,
  deleteJobBooking,
  dashboardData,
  jobDetail,
  uteDetail,
  deleteUser,
  deleteQueries,
  createUteBooking,
  jobBookingDetail,
  uteJobList,
  jobList,
  paymentHistory
} = require("../controllers/AdminController");
const adminValidateToken = require("../middleware/adminValidateToken");
const {
  loginData,
  forgotPass1,
  userOTPVerify,
} = require("../validations/validations");
const upload = require("../functions/upload");
router.post("/login", loginData, login);
router.post("/send-otp", forgotPass1, sendForgotPasswordOTP);
router.post("/verify-otp/:email", userOTPVerify, verifyOtp);
router.post("/reset-password", resetPassword);
router.post("/change-password", adminValidateToken, changePassword);
router.get("/get-all-ute-list", adminValidateToken, allUte);
router.get("/get-ute-detail/:id", adminValidateToken, uteDetail);
router.put("/delete-ute/:id",adminValidateToken,deleteUte)
router.get("/get-all-job-list", adminValidateToken, allJobs);
router.get("/get-job-detail/:id", adminValidateToken, jobDetail);
router.put("/delete-job/:id",adminValidateToken,deleteJob)
router.get("/all-users-data", adminValidateToken, getAllUser);
router.put("/delete-user/:id",adminValidateToken,deleteUser)
router.patch("/user-job-approved/:id", adminValidateToken, userJobStatus);
router.patch("/user-ute-status/:id", adminValidateToken, userUteStatus);
router.patch("/user-job-suspended/:id", adminValidateToken, userJobSuspended);
router.put("/update-user-status/:id", adminValidateToken, updateUserStatus);
router.post("/create-blog", adminValidateToken, upload, createBlog);
router.get("/all-blogs", adminValidateToken, allBlog);
router.get("/blog-detail/:id", adminValidateToken, blogDetail);
router.put("/update-blog/:id", adminValidateToken, upload, updateBlog);
router.put("/delete-blog/:id", adminValidateToken, deleteBlog);
router.post("/create-faq", adminValidateToken, createFaq);
router.get("/all-queries", adminValidateToken, getQueries);
router.patch("/reply-query", adminValidateToken, replyQueries);
router.put("/delete-queries/:id",adminValidateToken,deleteQueries)
router.get("/all-faq", adminValidateToken, faqList);
router.get("/faq-detail/:id", adminValidateToken, faqDetail);
router.put("/update-faq/:id", adminValidateToken, updateFaq);
router.put("/delete-faq/:id", adminValidateToken, deleteFaq);
router.get("/all-booking-list", adminValidateToken, getAllBookingList);
router.post("/create-job-booking", adminValidateToken, upload,createJobBooking);
router.get("/job-booking-detail/:id", adminValidateToken,jobBookingDetail);
router.put("/update-job-booking/:id", adminValidateToken, upload, updateJobBooking);
router.put("/delete-job-booking/:id", adminValidateToken, deleteJobBooking);
router.get("/dashboard-data", adminValidateToken, dashboardData);
router.post("/create-ute-booking", adminValidateToken, createUteBooking);
router.get("/ute-list", adminValidateToken, uteJobList);
router.get("/job-list", adminValidateToken, jobList);
router.get("/payment-history", adminValidateToken, paymentHistory);
module.exports = router;




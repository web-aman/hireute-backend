const express = require("express");
const {
  register,
  login,
  sendForgotPasswordOTP,
  validOtp,
  resetPassword,
  changePassword,
  postJob,
  jobLists,
  verifyEmailOtp,
  sendEmailOtp,
  checkToken,
  updateProfile,
  getUserProfile,
  allUte,
  uteByLocation,
  jobDetail,
  userJoblist,
  relatedTownInUte,
  allBlog,
  blogDetail,
  faqList,
  singleJobDetail,
  postQuery,
  myBooking,
  userLikedUte,
  getFavouriteUte,
  uteLikeJob,
  getFavouriteJob,
  userApplyUte,
  myUteBooking,
  uteAcceptBooking,
  jobAcceptBooking,
  myJobApplyList,
  myUteApplyList,
  jobChangePaymentStatus,
  uteOwnerChangePaymentStatus,
  userDashboardApi,
  likedDislikedBlog,
  favouriteBlog,
  jobBookingDetail,
  uteOwnerAcceptedBoookings,
  getMyJobs,
  placeUte,
  payUte,
  jobAllAcceptedBookings,
  myUteBookingList,
  deliveredByUte,
  myUte,
  myJobStatus,
  myJobRequest,
  uteDispatch,
  createAccount,
  getAccountDetails,
  getConnectAccountDashBoardLink
} = require("../controllers/UserController");
const validateToken = require("../middleware/validateTokenHandler");
const upload = require("../functions/upload");
const { uteApplyJob } = require("../controllers/UteController");
const { loginData, forgotPass, resetPass, userOTPVerified, userChangePassword, userOTPVerify } = require("../validations/validations");
const router = express.Router();
router.post("/register", register);
router.post("/verify-email-otp/:id", userOTPVerify, verifyEmailOtp);
router.post("/login", loginData, login);
router.post("/send-email-otp", sendEmailOtp);
router.post("/send-otp", forgotPass, sendForgotPasswordOTP);
router.post("/validate-otp", userOTPVerified, validOtp);
router.post("/reset-password", resetPass, resetPassword);
router.get("/check-token", validateToken, checkToken);
router.post("/change-password", validateToken, userChangePassword, changePassword);
router.get("/get-user-profile", validateToken, getUserProfile);
router.patch("/update-profile", validateToken, updateProfile);
router.post("/post-job/:id?", validateToken, upload, postJob);
router.get("/job-list", jobLists);
router.get("/single-job-detail/:id?", singleJobDetail);
router.get("/related-ute-in-town", validateToken, relatedTownInUte);
router.get("/all-ute-list", allUte);
router.get("/ute-by-location", uteByLocation);
router.get("/job-detail",jobDetail);
router.get("/user-job-list", validateToken, userJoblist);
router.get("/all-blogs", allBlog);
router.get("/blog-detail/:id", blogDetail);
router.put("/blog-liked-disliked/:id", validateToken, likedDislikedBlog);
router.get("/favourite-blogs-list", validateToken, favouriteBlog);
router.get("/all-faq", faqList);
router.post("/post-query", postQuery);
router.post("/jobuser-apply-ute/:id", validateToken, userApplyUte)
router.get("/uteowner-all-booking-list", validateToken, myUteBooking);
router.post("/uteowner-accept-booking/:id", validateToken, uteAcceptBooking);
router.get("/uteowner-accepted-bookings", validateToken, uteOwnerAcceptedBoookings); // ute owner accept job booking 
router.patch("/uteowner-change-payment-status/:id", validateToken, uteOwnerChangePaymentStatus) // ute owner change payment status
router.get("/my-uteowner-apply-list", validateToken, myUteApplyList) // user all applied ute list
router.post("/uteowner-apply-job/:id", validateToken, uteApplyJob) //when ute owner will apply for job
router.get("/my-jobuser-booking-list", validateToken, myBooking);// all job user booking list
router.patch("/jobuser-accept-booking/:id", validateToken, jobAcceptBooking); // job user accept ute owner applied req
router.patch("/jobuser-change-payment-status/:id", validateToken, jobChangePaymentStatus) // job user accept payment or reject payment
router.get("/jobuser-ute-apply-list", validateToken, myJobApplyList) // ute owner all  applied job list
router.put("/user-liked-ute/:id", validateToken, userLikedUte)
router.get("/get-favourite-ute", validateToken, getFavouriteUte)
router.put("/uteowner-liked-job/:id", validateToken, uteLikeJob)
router.get("/get-favourite-job", validateToken, getFavouriteJob)
router.get("/job-booking-detail/:id", validateToken, jobBookingDetail)
router.get("/get-dashboard-api",validateToken,userDashboardApi)
router.post("/place-ute/:id", validateToken, placeUte);
router.post("/pay-ute/:id", validateToken, payUte);
router.get("/get-my-jobs", validateToken, getMyJobs)
router.get("/job-all-accepted-bookings",validateToken,jobAllAcceptedBookings)
router.get("/my-ute-booking", validateToken, myUteBookingList)
router.put("/deliverd-by-ute/:id", validateToken, deliveredByUte)
router.get("/my-ute-status", validateToken, myUteBookingList)
router.put("/deliverd-by-ute/:id", validateToken, deliveredByUte)
router.get("/my-booking", validateToken, myUte)
router.get("/my-job-status", validateToken, myJobStatus)
router.get("/my-job-request", validateToken, myJobRequest)
router.put("/ute-dispatch/:id", validateToken, uteDispatch)
router.post("/create-connect-account", validateToken, createAccount);
router.get("/get-account-details", validateToken, getAccountDetails);
router.get("/connect-account-dashboard", validateToken, getConnectAccountDashBoardLink);
module.exports = router;





const express = require("express");
const {
  postUte,
  allUte,
  uteDetail,
  getUserListedUte,
  singleUteDetail,
  updateUte,
} = require("../controllers/UteController");
const upload = require("../functions/upload");
const validateToken = require("../middleware/validateTokenHandler");
const router = express.Router();
router.post("/post-ute/:id?", validateToken,upload, postUte);
router.get("/all-ute",  allUte);
router.get("/ute-detail", validateToken, uteDetail);
router.get("/single-ute-detail/:id?", singleUteDetail);
router.get("/get-user-ute-list", validateToken, getUserListedUte);
router.put("/update-ute/:id", validateToken ,updateUte)
module.exports = router;



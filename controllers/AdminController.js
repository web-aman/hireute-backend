const md5 = require("md5");
const Admin = require("../models/AdminModel");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const { checkValidations } = require("../functions/checkvalidation");
const {
  generateRandomOTP,
  paginationQuery,
  pagination,
  filterUsers,
} = require("../functions/common");
const UteModel = require("../models/UteModel");
const UserModel = require("../models/UserModel");
const Blog = require("../models/BlogModel");
const JobModel = require("../models/JobModel");
const { sendMail } = require("../functions/mailer");
const Faq = require("../models/FaqModel");
const QueryModel = require("../models/QueryModel");
const JobBooking = require("../models/JobBookingModel");
const UteBooking = require("../models/UteBookingModel");
const Payment = require("../models/PaymentModel");
const moment = require("moment-timezone");

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    const checkValid = await checkValidations(errors);
    if (checkValid.type === "error") {
      return res.status(400).send({
        message: checkValid.errors.msg,
      });
    }
    const { email, password } = req.body;

    let user = await Admin.findOne(
      { email: email },
      {
        password: 1,
        email: 1,
      }
    ).lean(true);
    if (!user || user.password !== md5(password)) {
      return res.status(400).send({ message: "Invalid Username and Password" });
    }
    const token = jwt.sign({ user: user }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "30d",
    });
    Admin.updateOne(
      { _id: user._id, isDeleted: false },
      {
        $push: { tokens: token },
      }
    ).then();

    return res.status(201).json({
      message: "Admin login successfully !",
      token,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  }
};

const sendForgotPasswordOTP = async (req, res) => {
  try {
    const errors = validationResult(req);
    const checkValid = await checkValidations(errors);
    if (checkValid.type === "error") {
      return res.status(400).send({
        message: checkValid.errors.msg,
      });
    }

    let { email } = req.body;
    email = email.toLowerCase().trim();
    const [user, otp] = await Promise.all([
      Admin.findOne({ email }).lean(true),
      generateRandomOTP(),
    ]);

    const mailVaribles = {
      "%otp%": otp,
    };
    sendMail("admin-otp-verify", mailVaribles, email);
    Admin.updateOne(
      { email },
      {
        $set: {
          otp: otp,
        },
      }
    ).then();

    return res.status(200).json({
      email: user.email,
      message: "OTP sent successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    const checkValid = await checkValidations(errors);
    if (checkValid.type === "error") {
      return res.status(400).send({
        message: checkValid.errors.msg,
      });
    }
    const { email } = req.params;
    const { otp } = req.body;
    let user = await Admin.findOne({
      email: email,
      isDeleted: false,
    }).lean(true);

    const token = uuidv4();
    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }
    if (!user.otp) {
      return res.status(400).send({ message: "OTP not found" });
    }
    if (user.otp !== otp) {
      return res.status(400).send({ message: "Invalid OTP" });
    }

    Admin.updateOne(
      { _id: user._id },
      {
        $set: {
          token: token,
        },
        $unset: {
          otp: 1,
        },
      }
    ).then();
    return res.status(200).json({
      message: "OTP verified successfully!",
      token: token,
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    const checkValid = await checkValidations(errors);
    if (checkValid.type === "error") {
      return res.status(400).send({
        message: checkValid.errors.msg,
      });
    }

    const { newPassword, confirmPassword, token } = req.body;
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .send({ message: "New password and confirm password do not match." });
    }

    let user = await Admin.findOne({ token: token }).lean(true);
    if (!user) {
      return res.status(400).send({ message: "Admin not found." });
    }
    Admin.updateOne(
      { _id: user._id },
      {
        $set: {
          password: md5(newPassword),
          tokens: [],
        },
        $unset: {
          token: 1,
        },
      }
    ).then();

    return res.status(200).json({
      message: "Password reset successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    const checkValid = await checkValidations(errors);
    if (checkValid.type === "error") {
      return res.status(400).send({
        message: checkValid.errors.msg,
      });
    }
    const { oldPassword, newPassword, confirmPassword } = req.body;

    let user = await Admin.findOne(
      {
        _id: req.user._id,
      },
      {
        password: 1,
      }
    );
    if (user.password !== md5(oldPassword)) {
      return res.status(400).send({
        message:
          "The current password you provided does not match. Please double-check and try again.",
      });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).send({
        message:
          "The new password and confirm password entries must match. Please ensure they are identical.",
      });
    }
    Admin.updateOne(
      { _id: req.user._id },
      {
        $set: {
          password: md5(newPassword),
          tokens: [],
        },
      }
    ).then();
    return res.status(201).json({
      message: "Password change successfully!",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  }
};

const allUte = async (req, res) => {
  try {
    const { search } = req.query;

    let condition = { isDeleted: false, completeStep: { $exists: false } };

    if (search) {
      condition["fullName"] = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    const paginationData = await paginationQuery(req.query);

    const [allUte, totalCount] = await Promise.all([
      UteModel.find(condition)
        .sort({ _id: -1 })
        .skip(paginationData.skip)
        .limit(paginationData.pageSize)
        .lean(true),
      UteModel.countDocuments(condition),
    ]);

    let paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCount,
    };
    const getPagination = await pagination(paginationObj);

    if (allUte.length) {
      for (let data of allUte) {
        data["createdAt"] = moment(data.createdAt)
          .tz("Australia/Sydney")
          .format("MM-DD-YYYY");
      }
    }

    return res.status(200).json({
      message: "All posted ute list",
      data: allUte,
      totalCount,
      paginationData: getPagination,
    });
  } catch (error) {
    return res
      .status(500)
      .send({ message: "Something went wrong. Please try again later." });
  }
};

const uteDetail = async (req, res) => {
  try {
    const data = await UteModel.findOne(
      { _id: req.params.id, isDeleted: false, isApproved: true },
      {
        __v: 0,
        isDeleted: 0,
        updatedAt: 0,
        createdBy: 0,
        latitude: 0,
        latitude: 0,
        likedBy: 0,
        liked: 0,
      }
    ).lean(true);
    return res.status(200).json({
      message: "Ute detail retrived successfully !",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  }
};

const deleteUte = async (req, res) => {
  try {
    UteModel.updateOne(
      { _id: req.params.id },
      {
        $set: {
          isDeleted: true,
        },
      }
    ).then();
    return res.status(201).json({
      message: "Ute deleted successfully !",
    });
  } catch (error) {
    res.status(500).send({
      message: "Something went wrong. Please try again later.",
    });
  }
};

const allJobs = async (req, res) => {
  try {
    const { search, price } = req.query;

    let condition = { isDeleted: false, completeStep: { $exists: false } };

    if (search) {
      condition.serviceCity = {
        $regex: search.trim(),
        $options: "i",
      };
    }

    let sortOption = {
      budget: 1,
    };

    if (price === "high") {
      sortOption["budget"] = -1;
    }

    const paginationData = await paginationQuery(req.query);

    const [allJobs, totalCount] = await Promise.all([
      JobModel.find(condition)
        .sort(sortOption)
        .skip(paginationData.skip)
        .limit(paginationData.pageSize)
        .lean(true),
      JobModel.countDocuments(condition),
    ]);

    const paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCount,
    };
    const getPagination = await pagination(paginationObj);

    if (allJobs.length) {
      for (let data of allJobs) {
        data["createdAt"] = moment(data.createdAt)
          .tz("Australia/Sydney")
          .format("MM-DD-YYYY");
      }
    }

    return res.status(200).json({
      data: allJobs,
      totalCount,
      paginationData: getPagination,
      message: allJobs.length ? "All posted job list" : "No posted job found",
    });
  } catch (error) {
    return res
      .status(500)
      .send({ message: "Something went wrong. Please try again later." });
  }
};

const jobDetail = async (req, res) => {
  try {
    const data = await JobModel.findOne({
      _id: req.params.id,
      isDeleted: false,
    }).lean(true);
    return res.status(200).json({
      message: "Job detail retrived successfully !",
      data: data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  }
};

const userJobStatus = async (req, res) => {
  try {
    const { status } = req.query;
    const findJobUser = await JobModel.findOne(
      {
        _id: req.params.id,
      },
      { createdBy: 1, title: 1 }
    );
    if (!findJobUser) {
      return res.status(400).send({ message: "Job not found" });
    }
    const findEmail = await UserModel.findOne(
      {
        _id: findJobUser.createdBy,
      },
      { email: 1, title: 1 }
    );

    if (!findEmail) {
      return res.status(400).send({ message: "User not found" });
    }
    JobModel.updateOne(
      { _id: req.params.id },
      {
        $set: {
          status: status,
          // isDeleted:status === "Approved" ? false :true
          isApproved: status === "Approved" ? true : false,
        },
      }
    ).then();

    const mailVariables = {
      "%model%": "Job",
      "%status%": status,
      "%title%": findJobUser.title,
    };
    await sendMail("user-job-ute-status", mailVariables, findEmail.email);
    return res.status(201).json({
      message: `The job has been successfully ${status}!`,
    });
  } catch (error) {
    return res
      .status(500)
      .send({ message: "Something went wrong. Please try again later." });
  }
};

const userUteStatus = async (req, res) => {
  try {
    const { status } = req.query;
    const findJobUser = await UteModel.findOne(
      {
        _id: req.params.id,
      },
      { createdBy: 1, fullName: 1 }
    );
    if (!findJobUser) {
      return res.status(400).send({ message: "Job not found" });
    }
    const findEmail = await UserModel.findOne(
      {
        _id: findJobUser.createdBy,
      },
      { email: 1 }
    );
    if (!findEmail) {
      return res.status(400).send({ message: "User not found" });
    }
    UteModel.updateOne(
      { _id: req.params.id },
      {
        $set: {
          status: status,
          // isDeleted:status === "Approved" ? false :true,
          isApproved: status === "Approved" ? true : false,
        },
      }
    ).then();

    const mailVariables = {
      "%model%": "Ute",
      "%status%": status,
      "%title%": findJobUser.fullName,
    };
    await sendMail("user-job-ute-status", mailVariables, findEmail.email);
    return res.status(201).json({
      message: `The ute has been successfully ${status}!`,
    });
  } catch (error) {
    return res
      .status(500)
      .send({ message: "Something went wrong. Please try again later." });
  }
};

const userJobSuspended = async (req, res) => {
  try {
    JobModel.updateOne(
      { _id: req.params.id },
      {
        $set: {
          isDeleted: true,
        },
      }
    ).then();
    return res.status(201).json({
      message: "The job has been successfully rejected!",
    });
  } catch (error) {
    return res
      .status(500)
      .send({ message: "Something went wrong. Please try again later." });
  }
};

const getAllUser = async (req, res) => {
  try {
    let condition = {
      isDeleted: false,
    };

    if (req?.query?.search) {
      let searchQuery = {};
      searchQuery = await filterUsers({ search: req.query.search });
      condition = Object.assign(condition, searchQuery);
    }

    const paginationData = await paginationQuery(req.query);
    const [users, totalCount] = await Promise.all([
      UserModel.find(condition, {
        email: 1,
        firstName: 1,
        lastName: 1,
        phoneNumber: 1,
        address: 1,
        createdAt: 1,
        isActive: 1,
      })
        .sort({ _id: -1 })
        .skip(paginationData.skip)
        .limit(paginationData.pageSize)
        .lean(true),
      UserModel.countDocuments(condition),
    ]);
    const paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCount,
    };
    const getPagination = await pagination(paginationObj);

    if (users.length) {
      for (let data of users) {
        data["createdAt"] = moment(data.createdAt)
          .tz("Australia/Sydney")
          .format("MM-DD-YYYY");
      }
    }

    return res.status(200).json({
      message: "All user data retrieved successfully!",
      data: users,
      totalCount,
      paginationData: getPagination,
    });
  } catch (error) {
    return res
      .status(500)
      .send({ message: "Something went wrong. Please try again later." });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.query;
    const userId = req.params.id;
    const isActive = status === "active";
    const isDeleted = !isActive;

    const findUser = await UserModel.findOne(
      { _id: userId },
      { email: 1, firstName: 1, lastName: 1 }
    );

    if (!findUser) {
      return res.status(404).json({ message: "User not found." });
    }
    await UserModel.updateOne(
      { _id: userId },
      {
        $set: {
          isDeleted,
          isActive,
          tokens: isActive ? undefined : [],
          isVerified: isActive,
        },
      }
    );

    // Send email
    const mailVariables = {
      "%status%": isActive ? "Activate" : "Deactivate",
      "%firstName%": findUser.firstName,
      "%lastName%": findUser.lastName,
      "%email%": findUser.email,
    };
    await sendMail("user-status", mailVariables, findUser.email);
    await Promise.all([
      JobModel.updateMany({ createdBy: userId }, { $set: { isDeleted } }),
      UteModel.updateMany({ createdBy: userId }, { $set: { isDeleted } }),
    ]);

    return res.status(200).json({
      message: `User status has been ${
        isActive ? "activated" : "deactivated"
      }.`,
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  }
};

const createBlog = async (req, res) => {
  try {
    const getBlogImg = req?.files?.blogImg;
    const blogImages = getBlogImg?.map((item) => item.filename);
    const data = await Blog.create({
      title: req.body?.title,
      description: req.body?.description,
      blogImg: blogImages,
      createdBy: req?.user?._id,
    });
    return res.status(201).json({
      message: "Blog post successfully !",
      data: data,
    });
  } catch (error) {
    return res
      .status(500)
      .send({ message: "Something went wrong. Please try again later." });
  }
};

const allBlog = async (req, res) => {
  try {
    const paginationData = await paginationQuery(req.query);
    const [allBlogs, totalCount] = await Promise.all([
      Blog.find()
        .skip(paginationData.skip)
        .limit(Number(req.query.limit) || 10)
        .lean(true),
      Blog.countDocuments(),
    ]);

    const paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCount,
    };
    const getPagination = await pagination(paginationObj);
    return res.status(200).json({
      message: "Blog data retrieved successfully!",
      data: allBlogs,
      totalCount,
      paginationData: getPagination,
    });
  } catch (error) {
    res.status(500).send({
      message: "Something went wrong. Please try again later.",
    });
  }
};

const blogDetail = async (req, res) => {
  try {
    const data = await Blog.findOne({ _id: req.params.id }, {}).lean(true);
    return res.status(200).json({
      message: "Blog detail retrieved successfully!",
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      message: "Something went wrong. Please try again later.",
    });
  }
};

const updateBlog = async (req, res) => {
  try {
    const getBlogImg = req?.files?.blogImg;
    const blogImages = getBlogImg?.map((item) => item.filename);
    const data = await Blog.updateOne(
      { _id: req.params.id },
      {
        $set: {
          title: req.body?.title,
          description: req.body?.description,
        },
        $addToSet: {
          blogImg: blogImages,
        },
      }
    );
    return res.status(200).json({
      message: "Blog update successfully !",
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      message: "Something went wrong. Please try again later.",
    });
  }
};

const deleteBlog = async (req, res) => {
  try {
    Blog.updateOne(
      { _id: req.params.id },
      {
        $set: {
          isDeleted: true,
        },
      }
    ).then();
    return res.status(201).json({
      message: "Blog deleted successfully !",
    });
  } catch (error) {
    res.status(500).send({
      message: "Something went wrong. Please try again later.",
    });
  }
};

const createFaq = async (req, res) => {
  try {
    const data = await Faq.create({
      question: req.body?.question,
      answer: req.body?.answer,
    });
    return res.status(201).json({
      message: "Faq created successfully!",
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      message: "Something went wrong. Please try again later.",
    });
  }
};

const faqList = async (req, res) => {
  try {
    const paginationData = await paginationQuery(req.query);
    const [faqData, totalCount] = await Promise.all([
      Faq.find()
        .skip(paginationData.skip)
        .limit(Number(req.query.limit) || 10)
        .lean(true),
      Faq.countDocuments(),
    ]);
    const paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCount,
    };
    const getPagination = await pagination(paginationObj);
    return res.status(200).json({
      message: "All faq data retrieved successfully!",
      data: faqData,
      totalCount,
      paginationData: getPagination,
    });
  } catch (error) {
    return res.status(500).send({
      message: "Something went wrong. Please try again later.",
    });
  }
};

const faqDetail = async (req, res) => {
  try {
    const data = await Faq.findOne({ _id: req.params.id }, {});
    return res
      .status(201)
      .json({
        message: "Faq detail retrieved successfully!",
        data: data,
      })
      .lean(true);
  } catch (error) {
    res.status(500).send({
      message: "Something went wrong. Please try again later.",
    });
  }
};

const updateFaq = async (req, res) => {
  try {
    Faq.updateOne(
      { _id: req.params.id },
      {
        $set: {
          question: req.body?.question,
          answer: req.body?.answer,
        },
      }
    ).then();

    return res.status(201).json({
      message: "Faq update successfully!",
    });
  } catch (error) {
    res.status(500).send({
      message: "Something went wrong. Please try again later.",
    });
  }
};

const deleteFaq = async (req, res) => {
  try {
    Faq.updateOne(
      { _id: req.params.id },
      {
        $set: {
          isDeleted: true,
        },
      }
    ).then();
    return res.status(201).json({
      message: "Faq deleted successfully !",
    });
  } catch (error) {
    res.status(500).send({
      message: "Something went wrong. Please try again later.",
    });
  }
};

const deleteQueries = async (req, res) => {
  try {
    QueryModel.updateOne(
      { _id: req.params.id },
      {
        $set: {
          isDeleted: true,
        },
      }
    ).then();
    return res.status(201).json({
      message: "Query deleted successfully !",
    });
  } catch (error) {
    res.status(500).send({
      message: "Something went wrong. Please try again later.",
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    UserModel.updateOne(
      { _id: req.params.id },
      {
        $set: {
          isDeleted: true,
        },
      }
    ).then();
    return res.status(201).json({
      message: "User deleted successfully !",
    });
  } catch (error) {
    res.status(500).send({
      message: "Something went wrong. Please try again later.",
    });
  }
};

const deleteJob = async (req, res) => {
  try {
    JobModel.updateOne(
      { _id: req.params.id },
      {
        $set: {
          isDeleted: true,
        },
      }
    ).then();
    return res.status(201).json({
      message: "Job deleted successfully !",
    });
  } catch (error) {
    res.status(500).send({
      message: "Something went wrong. Please try again later.",
    });
  }
};

const getQueries = async (req, res) => {
  try {
    const { page = 1, limit = 2, sort = "latest", email = "" } = req.query;

    const query = {};
    if (email) {
      query.email = { $regex: email, $options: "i" };
    }

    const sortOption = sort === "latest" ? { date: -1 } : { date: 1 };

    const total = await QueryModel.countDocuments(query);
    const queries = await QueryModel.find(query)
      .sort(sortOption)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      queries,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong. Please try again later." });
  }
};

const replyQueries = async (req, res) => {
  try {
    const { queryId, reply } = req.body;

    if (!queryId || !reply) {
      return res
        .status(400)
        .json({ message: "Query ID and reply are required" });
    }

    const query = await QueryModel.findByIdAndUpdate(
      queryId,
      { $push: { replies: reply } },
      { new: true }
    );

    if (!query) {
      return res.status(404).json({ message: "Query not found" });
    }

    const recipientEmail = query.email;
    if (!recipientEmail) {
      return res.status(400).json({
        message: "No recipient email found in query",
        queryId: queryId,
      });
    }

    const mailVariables = {
      "%queryId%": queryId,
      "%reply%": reply,
      "%originalQuery%": query.message || "Not provided",
    };
    await sendMail("query-reply-notification", mailVariables, recipientEmail);

    res.status(200).json({
      message: "Reply sent successfully and email notification dispatched",
      query,
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  }
};

const getAllBookingList = async (req, res) => {
  try {
    const paginationData = await paginationQuery(req.query);
    const [bookingData, totalCount] = await Promise.all([
      JobBooking.find({})
        .skip(paginationData.skip)
        .limit(paginationData.pageSize)
        .lean(true),
      JobBooking.countDocuments(),
    ]);

    const paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCount,
    };
    const getPagination = await pagination(paginationObj);
    if (JobBooking.length) {
      return res.status(200).send({
        data: bookingData,
        current: bookingData.length,
        totalCount,
        pagination: getPagination,
        message: "All job booking list retrieved successfully !",
        data: bookingData,
      });
    }
    const data = await JobBooking.find().lean(true);
    return res.status(200).json({});
  } catch (error) {
    return res
      .status(500)
      .send({ message: "Something went wrong. Please try again later." });
  }
};

const createJobBooking = async (req, res) => {
  try {
    const getUteImg = req?.files?.jobImg;
    const jobBookingImg = getUteImg?.map((item) => item.filename);
    const genrateId = uuidv4();
    const bookingId = `BOOKINAUS${genrateId?.slice(-5)}`;
    const data = await JobBooking.create({
      firstName: req?.body?.firstName,
      lastName: req?.body?.lastName,
      email: req?.body?.email,
      phoneNumber: req?.body?.phoneNumber,
      jobTitle: req?.body?.jobTitle,
      jobLocation: req?.body?.jobLocation,
      jobState: req?.body?.jobState,
      jobImg: jobBookingImg,
      bookingId: bookingId,
    });
    return res.status(201).json({
      message: "Job booking create successfully !",
      data: data,
    });
  } catch (error) {
    return res.status(500).send({ message: "Something went wrong." });
  }
};

const jobBookingDetail = async (req, res) => {
  try {
    const data = await JobBooking.findOne({ _id: req.params.id }, {}).lean(
      true
    );
    return res.status(200).json({
      message: "Job booking detail retrieved successfully !",
      data: data,
    });
  } catch (error) {
    res.status(500).send({ message: "Something went wrong ." });
  }
};

const updateJobBooking = async (req, res) => {
  try {
    const getUteImg = req?.files?.jobImg;
    const jobBookingImg = getUteImg?.map((item) => item.filename);
    const findBooking = await JobBooking.findOne({ _id: req.params.id }).lean(
      true
    );
    if (!findBooking) {
      return res.status(400).json({
        message: "The booking id not found.",
      });
    }

    JobBooking.updateOne(
      { _id: req.params.id },
      {
        $set: {
          firstName: req?.body?.firstName,
          lastName: req?.body?.lastName,
          email: req?.body?.email,
          phoneNumber: req?.body?.phoneNumber,
          accountHolderName: req?.body?.accountHolderName,
          accountNumber: req?.body?.accountNumber,
          bankName: req?.body?.bankName,
          bsbNumber: req?.body?.bsbNumber,
          jobTitle: req?.body?.jobTitle,
          jobLocation: req?.body?.jobLocation,
          jobState: req?.body?.jobState,
        },
        $addToSet: {
          jobImg: jobBookingImg,
        },
      }
    ).then();
    return res.status(200).json({
      message: "Job booking data updated successfully!",
    });
  } catch {
    return res.status(500).send({
      message: "Something went wrong.",
    });
  }
};

const deleteJobBooking = async (req, res) => {
  try {
    JobBooking.updateOne(
      {
        _id: req.params?.id,
      },
      {
        $set: { isDeleted: false },
      }
    ).then();
    return res.status(200).json({
      message: "Delete job booking .",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong .",
    });
  }
};

const dashboardData = async (req, res) => {
  try {
    let data = {};
    const totalUtedata = await UteModel.countDocuments({ isDeleted: false });
    const totalJobdata = await JobModel.countDocuments({ isDeleted: false });
    const totalActiveUser = await UserModel.countDocuments({ isActive: true });
    const totalDeactiveUser = await UserModel.countDocuments({
      isActive: false,
    });
    const totalJobBooking = await JobBooking.countDocuments({
      isDeleted: false,
      status: { $in: ["inProgress", "delivered"] },
    });
    const totalUteBooking = await UteBooking.countDocuments({
      isDeleted: false,
      status: { $in: ["inProgress", "delivered"] },
    });
    data.totalUtedata = totalUtedata;
    data.totalJobdata = totalJobdata;
    data.totalActiveUser = totalActiveUser;
    data.totalDeactiveUser = totalDeactiveUser;
    data.totalJobBooking = totalJobBooking;
    data.totalUteBooking = totalUteBooking;
    return res.status(200).json({
      message: "All total data retrieved successfully !",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong.",
    });
  }
};

const createUteBooking = async (req, res) => {
  try {
    const getUteImg = req?.files?.uteImages;
    const uteBookingImg = getUteImg?.map((item) => item.filename);
    const genrateId = uuidv4();
    const bookingId = `BOOKINAUS${genrateId?.slice(-5)}`;
    const data = await UteBooking.create({
      firstName: req?.body?.firstName,
      lastName: req?.body?.lastName,
      email: req?.body?.email,
      phoneNumber: req?.body?.phoneNumber,
      pickupAddress: req.body?.pickupAddress,
      dropAddress: req.body?.dropAddress,
      // accountHolderName: req?.body?.accountHolderName,
      // accountNumber: req?.body?.accountNumber,
      // bankName: req?.body?.bankName,
      // bsbNumber: req?.body?.bsbNumber,
      jobState: req?.body?.jobState,
      uteImages: uteBookingImg,
      bookingId: bookingId,
    });
    return res.status(201).json({
      message: "Ute booking create successfully !",
      data: data,
    });
  } catch (error) {
    return res.status(500).send({ message: "Something went wrong." });
  }
};

const uteBookingDetail = async (req, res) => {
  try {
    const data = await UteBooking.findOne({ _id: req.params.id }, {}).lean(
      true
    );
    return res.status(200).json({
      message: "Ute booking detail retrieved successfully !",
      data: data,
    });
  } catch (error) {
    res.status(500).send({ message: "Something went wrong ." });
  }
};

const updateUteBooking = async (req, res) => {
  try {
    const getUteImg = req?.files?.uteImages;
    const uteBookingImg = getUteImg?.map((item) => item.filename);
    const findBooking = await UteBooking.findOne({ _id: req.params.id }).lean(
      true
    );
    if (!findBooking) {
      return res.status(400).json({
        message: "The booking id not found.",
      });
    }

    UteBooking.updateOne(
      { _id: req.params.id },
      {
        $set: {
          firstName: req?.body?.firstName,
          lastName: req?.body?.lastName,
          email: req?.body?.email,
          phoneNumber: req?.body?.phoneNumber,
          pickupAddress: req.body?.pickupAddress,
          dropAddress: req.body?.dropAddress,
          accountHolderName: req?.body?.accountHolderName,
          accountNumber: req?.body?.accountNumber,
          bankName: req?.body?.bankName,
          bsbNumber: req?.body?.bsbNumber,
          jobState: req?.body?.jobState,
          uteImages: uteBookingImg,
        },
        $addToSet: {
          jobImg: uteBookingImg,
        },
      }
    ).then();
    return res.status(200).json({
      message: "Job booking data updated successfully!",
    });
  } catch {
    return res.status(500).send({
      message: "Something went wrong.",
    });
  }
};

const deleteUteBooking = async (req, res) => {
  try {
    UteBooking.deleteOne({
      _id: req.params?.id,
    }).then();
    return res.status(200).json({
      message: "Delete ute booking .",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong .",
    });
  }
};

const uteJobList = async (req, res) => {
  try {
    let paginationData = await paginationQuery(req.query);

    let [bookingData, totalCount] = await Promise.all([
      UteBooking.aggregate([
        {
          $match: {
            isDeleted: false,
            status: { $in: ["inProgress", "delivered"] },
          },
        },
        {
          $lookup: {
            from: "users",
            let: { bookingBy: "$bookingBy" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$bookingBy"] },
                },
              },
              {
                $project: {
                  firstName: 1,
                  lastName: 1,
                },
              },
            ],
            as: "users",
          },
        },
        {
          $unwind: {
            path: "$users",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            from: "utes",
            let: { uteId: "$uteId" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$uteId"] },
                },
              },
              {
                $project: {
                  fullName: 1,
                },
              },
            ],
            as: "ute",
          },
        },
        {
          $unwind: {
            path: "$ute",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $project: {
            amount: 1,
            status: 1,
            requestAmount: 1,
            actualAmount: 1,
            pickupAddress: 1,
            dropAddress: 1,
            createdAt: 1,
            bookingBy: {
              $concat: ["$users.firstName", " ", "$users.lastName"],
            },
            uteName: "$ute.fullName",
          },
        },
        {
          $skip: paginationData.skip,
        },
        {
          $limit: paginationData.pageSize,
        },
      ]),
      UteBooking.countDocuments({
        isDeleted: false,
        status: { $in: ["inProgress", "delivered"] },
      }),
    ]);

    const paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCount,
    };
    const getPagination = await pagination(paginationObj);

    if (bookingData.length) {
      for (let data of bookingData) {
        data["createdAt"] = moment(data.createdAt)
          .tz("Australia/Sydney")
          .format("MM-DD-YYYY");
      }
    }

    return res.status(200).send({
      data: bookingData,
      current: bookingData.length,
      totalCount,
      pagination: getPagination,
      message: bookingData.length
        ? "UTE bookings retrieved successfully."
        : "No ute booking found",
    });
  } catch (error) {
    return res.status(500).send({
      message: "Something went wrong . please try again later.",
    });
  }
};

const jobList = async (req, res) => {
  try {
    let paginationData = await paginationQuery(req.query);

    let [bookingData, totalCount] = await Promise.all([
      JobBooking.aggregate([
        {
          $match: {
            isDeleted: false,
            status: { $in: ["inProgress", "delivered"] },
          },
        },
        {
          $lookup: {
            from: "users",
            let: { createdBy: "$createdBy" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$createdBy"] },
                },
              },
              {
                $project: {
                  firstName: 1,
                  lastName: 1,
                },
              },
            ],
            as: "users",
          },
        },
        {
          $unwind: {
            path: "$users",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $lookup: {
            from: "utes",
            let: { uteId: "$uteId" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$uteId"] },
                },
              },
              {
                $project: {
                  fullName: 1,
                },
              },
            ],
            as: "ute",
          },
        },
        {
          $unwind: {
            path: "$ute",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $project: {
            amount: 1,
            status: 1,
            requestAmount: 1,
            actualAmount: 1,
            pickupAddress: 1,
            createdAt: 1,
            dropAddress: 1,
            bookingBy: {
              $concat: ["$users.firstName", " ", "$users.lastName"],
            },
            uteName: "$ute.fullName",
          },
        },
        {
          $skip: paginationData.skip,
        },
        {
          $limit: paginationData.pageSize,
        },
      ]),
      JobBooking.countDocuments({
        isDeleted: false,
        status: { $in: ["inProgress", "delivered"] },
      }),
    ]);

    const paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCount,
    };
    const getPagination = await pagination(paginationObj);

    if (bookingData.length) {
      for (let data of bookingData) {
        data["createdAt"] = moment(data.createdAt)
          .tz("Australia/Sydney")
          .format("MM-DD-YYYY");
      }
    }

    return res.status(200).send({
      data: bookingData,
      current: bookingData.length,
      totalCount,
      pagination: getPagination,
      message: bookingData.length
        ? "Job Booking retrieved successfully."
        : "No Job booking found",
    });
  } catch (error) {
    return res.status(500).send({
      message: "Something went wrong . please try again later.",
    });
  }
};

const paymentHistory = async (req, res) => {
  try {
    let paginationData = await paginationQuery(req.query);

    let [payment, totalCount] = await Promise.all([
      Payment.aggregate([
        {
          $match: {
            isDeleted: false,
            status: { $in: ["succeeded", "failed"] },
          },
        },
        {
          $lookup: {
            from: "users",
            let: { paymentBy: "$paymentBy" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$paymentBy"] },
                },
              },
              {
                $project: {
                  firstName: 1,
                  lastName: 1,
                  email: 1,
                },
              },
            ],
            as: "users",
          },
        },
        {
          $unwind: {
            path: "$users",
            preserveNullAndEmptyArrays: false,
          },
        },
        {
          $project: {
            amount: 1,
            status: 1,
            createdAt: 1,
            paymentBy: {
              $concat: ["$users.firstName", " ", "$users.lastName"],
            },
          },
        },
        {
          $skip: paginationData.skip,
        },
        {
          $limit: paginationData.pageSize,
        },
      ]),
      Payment.countDocuments({
        isDeleted: false,
        status: { $in: ["succeeded", "failed"] },
      }),
    ]);

    const paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCount,
    };
    const getPagination = await pagination(paginationObj);

    if (payment.length) {
      for (let data of payment) {
        data["createdAt"] = moment(data.createdAt)
          .tz("Australia/Sydney")
          .format("MM-DD-YYYY");
      }
    }

    return res.status(200).send({
      data: payment,
      current: payment.length,
      totalCount,
      pagination: getPagination,
      message: payment.length
        ? "Payment history received successfully."
        : "No payment found",
    });
  } catch (error) {
    return res.status(500).send({
      message: "Something went wrong . please try again later.",
    });
  }
};

module.exports = {
  login,
  sendForgotPasswordOTP,
  verifyOtp,
  resetPassword,
  changePassword,
  allUte,
  uteDetail,
  deleteUte,
  allJobs,
  jobDetail,
  deleteJob,
  userJobStatus,
  userUteStatus,
  userJobSuspended,
  getAllUser,
  updateUserStatus,
  createBlog,
  allBlog,
  updateBlog,
  deleteBlog,
  blogDetail,
  createFaq,
  faqList,
  faqDetail,
  updateFaq,
  deleteFaq,
  getQueries,
  replyQueries,
  getAllBookingList,
  createJobBooking,
  jobBookingDetail,
  updateJobBooking,
  deleteJobBooking,
  dashboardData,
  deleteQueries,
  deleteUser,
  createUteBooking,
  uteBookingDetail,
  updateUteBooking,
  deleteUteBooking,
  uteJobList,
  jobList,
  paymentHistory,
};

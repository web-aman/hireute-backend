const UserModel = require("../models/UserModel");
const jwt = require("jsonwebtoken");
const md5 = require("md5");
const {
  generateRandomOTP,
  paginationQuery,
  pagination,
  fileUploadFunc,
} = require("../functions/common");
const { sendMail } = require("../functions/mailer");
const { v4: uuidv4 } = require("uuid");
const JobModel = require("../models/JobModel");
const UteModel = require("../models/UteModel");
const Blog = require("../models/BlogModel");
const Faq = require("../models/FaqModel");
const QueryModel = require("../models/QueryModel");
const JobBooking = require("../models/JobBookingModel");
const Application = require("../models/Application");
const UteBooking = require("../models/UteBookingModel");
const { validationResult } = require("express-validator");
const { checkValidations } = require("../functions/checkvalidation");
const { default: mongoose } = require("mongoose");
const BlogModel = require("../models/BlogModel");
const {
  createPaymentIntends,
  createCustomer,
  createConnectAccount,
  getAccounts,
  getConnectAccountDashBoardLinkFn,
} = require("../functions/payment");
const Payment = require("../models/PaymentModel");
require("dotenv").config();

const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    const checkValid = await checkValidations(errors);
    if (checkValid.type === "error") {
      return res.status(400).send({
        message: checkValid.errors.msg,
      });
    }

    let { firstName, lastName, phoneNumber, email, address, password } =
      req.body;

    email = email.toLowerCase().trim();

    const [existingUser, isNotVerifiedEmail] = await Promise.all([
      UserModel.countDocuments({ email: email, isDeleted: false, isVerified: true }),
      UserModel.countDocuments({ email: email, isDeleted: false, isVerified: false }),
    ]);

    if (isNotVerifiedEmail) {
      await UserModel.deleteOne({ email });
    }

    if (existingUser) {
      return res.status(400).send({
        message:
          "Email is already registered and verified, please use a different email address.",
      });
    }

    const [otp, customerId] = await Promise.all([
      generateRandomOTP(),
      createCustomer({ fullName: `${firstName} ${lastName}`, email }),
    ]);

    let obj = {
      firstName,
      lastName,
      phoneNumber,
      email,
      address: address,
      otp,
      customer: customerId.data,
      password: md5(password),
    };

    const mailVariables = {
      "%otp%": obj.otp,
    };

    sendMail("register-otp-verify", mailVariables, obj.email);

    const data = await UserModel.create(obj);

    return res.status(201).json({
      data: data._id,
      message: "User Registered successfully",
    });
  } catch (error) {
    return res.status(500).send({ message: "Something went wrong." });
  }
};

const verifyEmailOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    const checkValid = await checkValidations(errors);
    if (checkValid.type === "error") {
      return res.status(400).send({
        message: checkValid.errors.msg,
      });
    }

    const user = await UserModel.findOne(
      { _id: req.params.id, isDeleted: false, isVerified: false },
      { firstName: 1, lastName: 1, email: 1, role: 1, otp: 1 }
    ).lean(true);

    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }

    if (user?.otp !== req.body.otp) {
      return res.status(400).send({ message: "Invalid OTP" });
    }

    const data = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
    };
    const token = jwt.sign({ user: data }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "30d",
    });

    UserModel.updateOne(
      { _id: user._id },
      {
        $set: { isVerified: true },
        $unset: { otp: "" },
        $push: { tokens: token },
      }
    ).then();

    return res.status(200).json({
      data: token,
      message: "User validate successfully",
    });
  } catch (error) {
    return res.status(500).send({ message: "Something went wrong" });
  }
};

const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    const checkValid = await checkValidations(errors);
    if (checkValid.type === "error") {
      return res.status(400).send({
        message: checkValid.errors.msg,
      });
    }
    let { email, password } = req.body;

    email = email.toLowerCase().trim();

    let data = await UserModel.findOne(
      { email, isDeleted: false },
      {
        firstName: 1,
        lastName: 1,
        email: 1,
        password: 1,
        role: 1,
        isVerified: 1,
        isActive: 1,
      }
    ).lean(true);

    if (data?.password !== md5(password)) {
      return res.status(400).send({ message: "Invalid Username and Password" });
    }

    if (!data.isVerified) {
      return res.status(400).send({
        message: "You are not verified, please verified your account",
      });
    }

    const token = jwt.sign({ user: data }, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "30d",
    });

    UserModel.updateOne({ _id: data._id }, { $push: { tokens: token } }).then();

    return res.status(200).send({ token, message: "Login Successfully" });
  } catch (error) {
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

const sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).send({ message: "Email is required" });

    const trimmedEmail = email.toLowerCase().trim();
    let user = await UserModel.findOne({ email: trimmedEmail });

    if (user && !user.isDeleted && !user.otp && user.isVerified) {
      return res
        .status(400)
        .send({ message: "Email already registered and verified" });
    }

    const otp = generateRandomOTP();
    const token = uuidv4();
    if (!user) {
      user = new UserModel({
        email: trimmedEmail,
        otp,
        isDeleted: false,
        token: token,
      });
    } else {
      user.otp = otp;
      user.token = token;
      if (user.isDeleted) {
        user.isDeleted = false;
      }
    }
    await user.save();
    const mailVariables = {
      "%otp%": otp,
    };
    await sendMail("register-otp-verify", mailVariables, trimmedEmail);

    return res.status(200).json({
      message: "OTP sent to your email",
      token: token,
      email: trimmedEmail,
    });
  } catch (error) {
    return res.status(500).send({ message: "Failed to send OTP" });
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
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const user = await UserModel.findOne({ email: normalizedEmail })
      .select("_id email isVerified")
      .lean();

    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }
    if (user.isVerified !== true) {
      return res.status(400).send({ message: "Email is not verified" });
    }
    const otp = generateRandomOTP();
    const mailVariables = {
      "%otp%": otp,
    };

    UserModel.updateOne({ _id: user._id }, { $set: { otp: otp } }).then();

    await sendMail("forget-password-otp", mailVariables, normalizedEmail);

    return res.status(200).json({
      id: user._id,
      email: user.email,
      message: "OTP sent successfully",
    });
  } catch (error) {
    return res.status(500).send({ message: "Something went wrong" });
  }
};

const validOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    const checkValid = await checkValidations(errors);
    if (checkValid.type === "error") {
      return res.status(400).send({
        message: checkValid.errors.msg,
      });
    }
    const { userId, code } = req.body;
    if (!userId || !code) {
      return res.status(400).send({ message: "Otp Required" });
    }

    const user = await UserModel.findOne({ _id: userId }).lean(true);
    if (!user) {
      return res.status(400).send({ message: "User not found" });
    }

    if (user.otp !== code) {
      return res.status(400).send({ message: "Invalid OTP" });
    }
    const token = uuidv4();
    UserModel.updateOne(
      { _id: user._id, isDeleted: false },
      {
        $set: {
          token: token,
        },
        $unset: { otp: "" },
      }
    ).then();

    return res.status(201).json({
      message: "OTP validated successfully!",
      data: token,
    });
  } catch (error) {
    return res.status(500).send({ message: "Something went wrong ." });
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
    if (!newPassword || !confirmPassword) {
      return res.status(400).send({
        message: "New password and confirm password must be provided.",
      });
    }
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .send({ message: "New password and confirm password do not match." });
    }

    const sanitizedToken = token === "null" ? null : token;
    const user = await UserModel.findOne(
      { token: sanitizedToken },
      { _id: 1 }
    ).lean(true);

    if (!user) {
      return res.status(400).send({
        message: "User not found",
      });
    }

    UserModel.updateOne(
      { _id: user._id },
      { $set: { password: md5(newPassword) } },
      { $unset: { token: "" } }
    ).then();

    return res.status(201).json({
      message: "Password reset successfully !",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong .",
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
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (req?.user?.password !== md5(currentPassword)) {
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

    UserModel.updateOne(
      { _id: req.user._id },
      { $set: { password: md5(newPassword), tokens: [] } }
    ).then();
    return res.status(200).send({
      status: 200,
      message: "Your password has been successfully changed.",
    });
  } catch (error) {
    return res.status(500).send({
      message: "Something went wrong. Please try again later.",
    });
  }
};

const postJob = async (req, res) => {
  try {
    const id = req?.params?.id;
    const step = parseInt(req.body.step);

    let fileData;
    if (req.files && req.files?.length > 0) {
      fileData = await fileUploadFunc(req, res);

      if (fileData.type !== "success") {
        return res.status(fileData.status).send({
          message:
            fileData?.type === "fileNotFound"
              ? "Please upload the image"
              : fileData.type,
        });
      }
    }

    const getUteImg = req?.files?.jobImg;
    const jobImages = getUteImg?.map((item) => item.filename);

    if (![1, 2, 3, 4].includes(step)) {
      return res.status(400).send({ message: "Invalid step" });
    }
    if (id !== "undefined" || null || id !== undefined || id !== "") {
      const checkStep = await JobModel.findOne(
        { _id: id },
        {
          completeStep: 1,
        }
      ).lean(true);
      if (step > 1 && checkStep?.completeStep > step) {
        return res.status(400).send({
          message: `Please complete step ${
            step - 1
          } before proceeding to step ${step}.`,
        });
      } else {
      }
    }
    const createdId = req?.user?._id.toString();
    const jobUserId = `Job${createdId?.slice(-5)}`;
    switch (step) {
      case 1:
        if (id == "undefined" || null || id == undefined || id == "") {
          const jobCreate = {
            title: req.body.title,
            description: req.body.description,
            createdBy: req.user._id,
            jobUserId: jobUserId,
            completeStep: 1,
          };

          const data = await JobModel.create(jobCreate);
          return res.status(201).json({
            message: "Job first step job post successully !",
            data: data,
          });
        } else {
          JobModel.updateOne(
            {
              _id: id,
            },
            {
              $set: {
                title: req.body.title,
                description: req.body.description,
                jobUserId: jobUserId,
                completeStep: 1,
              },
            }
          ).then();
          return res.status(201).json({
            message: "Job first step update successully !",
          });
        }

      case 2:
        if (!id) {
          return res.status(400).json({ message: "ID is required for step 2" });
        }
        JobModel.updateOne(
          { _id: id },
          {
            $set: {
              country: req.body.country,
              state: req.body.state,
              location: req.body.location,
              latitude: req.body.latitude,
              longitude: req.body.longitude,
              completeStep: 2,
            },
          }
        ).then();

        await UserModel.updateOne(
          { _id: req.user._id },
          {
            $addToSet: {
              location: req.body.location,
            },
          }
        );
        return res.status(201).json({
          message: "Job second step job post successully !",
        });

      case 3:
        if (!id) {
          return res.status(400).json({ message: "ID is required for step 3" });
        }
        JobModel.updateOne(
          { _id: id },
          {
            $set: {
              workSchedule: req.body.workSchedule,
              jobImg: jobImages,
              completeStep: 3,
            },
          }
        ).then();
        return res.status(201).json({
          message: "Job third step job post successfully !",
        });

      case 4:
        if (!id) {
          return res.status(400).json({ message: "ID is required for step 4" });
        }
        JobModel.updateOne(
          { _id: id },
          {
            $set: {
              budget: req.body.budget,
            },
            status: "Pending",
            $unset: { completeStep: "" },
          }
        ).then();
        return res.status(201).json({
          message: "All job post successfully !",
        });
    }
  } catch (error) {
    res.status(500).send({ message: "Something went wrong ." });
  }
};

const allUte = async (req, res) => {
  try {
    const { search, location, price, sort, id } = req.query;
    const condition = {
      status: "Approved",
      isApproved: true,
      isDeleted: false,
    };
    if (search?.trim()) {
      condition.serviceCity = {
        $regex: search.trim(),
        $options: "i",
      };
    }
    if (location) {
      condition.state = {
        $in: location.split(",").map((loc) => loc.trim()),
      };
    }
    const sortOptions = {};
    if (price === "low") sortOptions.budget = 1;
    if (price === "high") sortOptions.budget = -1;
    if (sort === "newest") sortOptions.createdAt = -1;
    if (sort === "oldest") sortOptions.createdAt = 1;

    const paginationData = await paginationQuery(req.query);
    const [utes, totalCount] = await Promise.all([
      UteModel.find(condition, {
        liked: 0,
        likedBy: 0,
        isActive: 0,
        isApproved: 0,
        isDeleted: 0,
        updatedAt: 0,
        createdBy: 0,
        __v: 0,
      })
        .sort(sortOptions)
        .skip(paginationData.skip)
        .limit(paginationData.pageSize)
        .lean(true),
      UteModel.countDocuments(condition),
    ]);
    let favoriteUteIds = [];
    if (mongoose.isValidObjectId(id)) {
      const user = await UserModel.findOne({ _id: id })
        .select("favoriteUtes")
        .lean();

      favoriteUteIds = user?.favoriteUtes?.map((id) => id.toString()) || [];
    }

    const enhancedUtes = utes.map((ute) => ({
      ...ute,
      liked: favoriteUteIds.includes(ute._id.toString()),
    }));

    let paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCount,
    };
    const getPagination = await pagination(paginationObj);

    return res.status(200).json({
      success: true,
      message: "UTE listings retrieved successfully",
      data: enhancedUtes,
      pagination: getPagination,
      totalCount,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong . please try again later . ",
    });
  }
};

const jobLists = async (req, res) => {
  try {
    let { search, workSchedule, price, location, id } = req.query;
    const condition = {
      status: "Approved",
      isDeleted: false,
      isApproved: true,
    };
    if (search?.trim()) {
      condition.location = { $regex: search.trim(), $options: "i" };
    }
    if (location) {
      condition.state = { $in: location.split(",").map((s) => s.trim()) };
    }
    if (workSchedule) {
      condition.workSchedule = { $in: [].concat(workSchedule).filter(Boolean) };
    }
    const sortOption =
      price === "low" ? { budget: 1 } : price === "high" ? { budget: -1 } : {};

    const userPromise =
      id && mongoose.Types.ObjectId.isValid(id)
        ? UserModel.findOne({ _id: id, isDeleted: false })
            .select("favoriteJob")
            .lean()
        : null;
    const paginationData = await paginationQuery(req.query);
    const [jobData, totalCount, user] = await Promise.all([
      JobModel.find(condition, {
        __v: 0,
        completeStep: 0,
        createdAt: 0,
        status: 0,
        createdBy: 0,
        updatedAt: 0,
      })
        .sort(sortOption)
        .skip(paginationData.skip)
        .limit(paginationData.pageSize)
        .lean(),
      JobModel.countDocuments(condition, {
        __v: 0,
        completeStep: 0,
        isDeleted: 0,
        createdAt: 0,
        status: 0,
        createdBy: 0,
        updatedAt: 0,
      }),
      userPromise,
    ]);
    const favoriteJobIds = new Set(
      user?.favoriteJob?.map((id) => id.toString()) || []
    );
    const enhancedJob = jobData.map((job) => ({
      ...job,
      liked: favoriteJobIds.has(job._id.toString()),
    }));
    const paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCount,
    };
    const getPagination = await pagination(paginationObj);
    return res.status(200).send({
      data: enhancedJob,
      totalCount,
      pagination: getPagination,
      message: enhancedJob.length
        ? "Job list retrieved successfully!"
        : "No matching jobs found",
    });
  } catch (error) {
    return res.status(500).send({ message: "Something went wrong" });
  }
};

const userJoblist = async (req, res) => {
  try {
    let { search } = req.query;
    let condition = {};

    // if (req?.user?.role === "user" ) {
    condition.createdBy = req.user._id;
    // }

    if (search) {
      search = search.trim();
      if (search) {
        condition.title = {
          $regex: search,
          $options: "i",
        };
      }
    }
    const paginationData = await paginationQuery(req.query);

    const [jobData, totalCount] = await Promise.all([
      JobModel.find(condition)
        .skip(paginationData.skip)
        .limit(paginationData.pageSize)
        .lean(true),
      JobModel.countDocuments(condition),
    ]);
    const jobView = await JobModel.updateOne(
      { _id: req.params.id },
      { $inc: { views: 1 } }
    );
    const paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCount,
    };
    const getPagination = await pagination(paginationObj);

    if (JobModel.length) {
      return res.status(200).send({
        data: jobData,
        current: jobData.length,
        totalCount,
        pagination: getPagination,
        message: "Job list retrieved successfully !",
      });
    }
  } catch (error) {
    return res.status(500).send({ message: "Something went wrong" });
  }
};

const jobDetail = async (req, res) => {
  try {

    const jobData = await JobModel.findOne(
      {
        completeStep: { $gte: 1, $lt: 4 },
      },
      {}
    ).lean();

    if (!jobData) {
      return res.status(200).json({
        message: "No incomplete job found",
        data: null,
      });
    }
    const user = await UserModel.findOne({ email: req.query?.email }).select(
      "favoriteJob"
    );
    const favoriteJob = await UteModel.findOne({
      _id: { $in: user?.favoriteJob },
    }).lean();
    const liked =
      favoriteJob?._id?.toString() === req.params?.id?.toString()
        ? true
        : false;
    jobData.liked = liked;

    return res.status(200).json({
      message: "Incomplete job found successfully!",
      data: jobData,
      nextStep: jobData.completeStep + 1,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong .",
    });
  }
};

const singleJobDetail = async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const { email } = req.query;
    if (!jobId) {
      return res.status(400).json({ message: "Job ID is required." });
    }

    let [jobData, jobBooking, user] = await Promise.all([
      JobModel.findOne(
        { _id: jobId, isDeleted: false },
        { __v: 0, status: 0, latitude: 0, longitude: 0, isDeleted: 0 }
      ).lean(),
      JobBooking.countDocuments({
        createdBy: req?.query?.userId,
        jobId: req.params.id,
      }),
      UserModel.findOne({ email }).select("favoriteJob").lean(),
    ]);

    if (!jobData) {
      return res.status(404).json({ message: "Job not found." });
    }

    jobData["isApplied"] = false;

    if (jobBooking) {
      jobData["isApplied"] = true;
    }

    JobModel.updateOne({ _id: jobId }, { $inc: { views: 1 } }).then();

    const liked =
      user?.favoriteJob?.some(
        (favId) => favId.toString() === jobId.toString()
      ) || false;
    return res.status(200).json({
      message: "Job fetched successfully.",
      data: { ...jobData, liked },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong . please try again later.",
    });
  }
};

const checkToken = async (req, res) => {
  try {
    let user = await UserModel.findOne({ _id: req.user._id ,isDeleted: false}).lean(true);
    let isConnectAccountEnabled = false;

    if (user?.accountId) {
      const account = await getAccounts(user.accountId);

      if (account && account.data.payouts_enabled) {
        isConnectAccountEnabled = true;
      }
    }

    return res.status(200).json({
      message: "Token is valid",
      user: {
        id: user._id,
        fullName: `${user.firstName} ${user.lastName}`,
        email: user.email,
        profileImg: user.profileImg,
        role: user.role,
        isConnectAccount: isConnectAccountEnabled,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong . please try again later .",
    });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await UserModel.findOne({ _id: userId })
      .select("-password -__v")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const [totalUte, totalJob] = await Promise.all([
      UteModel.countDocuments({ createdBy: req.user._id }).lean(),
      JobModel.countDocuments({ createdBy: req.user._id }).lean(),
    ]);

    const totalEnquiry = totalUte + totalJob;

    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: {
        ...user,
        totalUte: totalUte,
        totalJob: totalJob,
        totalEnquiry: totalEnquiry,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong .",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;
    let fileData = await fileUploadFunc(req, res);
    const profileImg = fileData.data.profileImg?.[0].filename;
    const coverImg = fileData.data.coverImg?.[0].filename;
    const { firstName, lastName, email, phoneNumber, address, password } =
      req?.body;
    const allFieldsFilled = [
      firstName,
      lastName,
      email,
      phoneNumber,
      address,
    ].every((field) => field && field.toString().trim() !== "");

    const updateData = {
      firstName,
      lastName,
      email,
      phoneNumber,
      address,
      profileImg,
      coverImg,
      ...(password && { password: md5(password) }),
      isCompleteProfile: userRole === "user" ? true : allFieldsFilled,
    };

    UserModel.updateOne(
      { _id: userId },
      {
        $set: updateData,
        $unset: { tokens: [] },
      }
    ).then();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      // data: user,
    });
  } catch (error) {
    if (error.name === "DocumentNotFoundError") {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Something went wrong . please try again later.",
    });
  }
};

const uteByLocation = async (req, res) => {
  try {
    const data = await UteModel.find({}, { state: 1 }).lean(true);
    if (data.length <= 0) {
      return res.status(200).json({
        message: "Not any  ute available according to your location. ",
      });
    }
    const uniqueData = Array.from(
      new Map(
        data.filter((item) => item.state).map((item) => [item.state, item])
      ).values()
    );
    return res.status(200).json({
      message: "Ute data retrieved successfully by location!",
      data: uniqueData,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong .",
    });
  }
};

const relatedTownInUte = async (req, res) => {
  try {
    const userJobs = await JobModel.find(
      { createdBy: req.user._id },
      { state: 1 }
    );
    const jobLocations = [...new Set(userJobs.map((job) => job.state))];
    if (jobLocations.length === 0) {
      return res
        .status(200)
        .json({ message: "No job locations found", data: [] });
    }
    const data = await UteModel.find({ state: { $in: jobLocations } }).lean(
      true
    );
    res.status(200).json({
      message: "All related ute in your town retrieved successfully !",
      data,
    });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong ." });
  }
};

const allBlog = async (req, res) => {
  try {
    const { newest } = req.query;
    let sortCondition = newest === "true" ? { createdAt: -1 } : {};
    const paginationData = await paginationQuery(req.query);
    const [allBlogs, totalCount] = await Promise.all([
      Blog.find(
        { isDeleted: false },
        { createdBy: 0, isDeleted: 0, __v: 0, updatedAt: 0 }
      )
        .sort(sortCondition)
        .skip(paginationData.skip)
        .limit(paginationData.pageSize)
        .lean(true),
      Blog.estimatedDocumentCount(),
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
    res.status(500).send({ message: "Something went wrong." });
  }
};

const blogDetail = async (req, res) => {
  try {
    const data = await Blog.findByIdAndUpdate(
      { _id: req.params.id },
      { $inc: { views: 1 } },
      {
        __v: 0,
        createdAt: 0,
        updatedAt: 0,
        isDeleted: 0,
      },
      { new: true }
    ).lean(true);

    return res.status(200).json({
      message: "Blog detail retrieved successfully!",
      data: data,
    });
  } catch (error) {
    res.status(500).send({
      message: "Something went wrong . please try again later .",
    });
  }
};

const likedDislikedBlog = async (req, res) => {
  try {
    const { liked } = req.body;
    const blogId = req.params.id;
    if (!blogId) {
      return res.status(400).json({
        success: false,
        message: "Valid Blog ID is required.",
      });
    }
    const uteExists = await BlogModel.exists({ _id: blogId });
    if (!uteExists) {
      return res.status(404).json({
        success: false,
        message: "Blog not found.",
      });
    }
    UserModel.updateOne(
      { _id: req.user._id },
      liked
        ? { $addToSet: { favoriteBlog: blogId } }
        : { $pull: { favoriteBlog: blogId } }
    ).then((updateResult) => {
      if (!updateResult.matchedCount) {
        return res.status(404).json({ message: "User not found." });
      }
      res.status(200).json({
        message: liked ? "Added to favourites." : "Removed from favourites.",
        data: { liked },
      });
    });
  } catch (error) {
    return res.status(500).send({
      message: "Something went wrong . please try again later .",
    });
  }
};

const favouriteBlog = async (req, res) => {
  try {
    const data = await UserModel.find(
      {},
      {
        favouriteBlog: 1,
      }
    );

    return res.status(200).json({
      message: "All your favorite blogs retrived successfully !",
      data: data,
    });
  } catch (error) {
    return res.status(500).send({ message: "Something went wrong ." });
  }
};
const faqList = async (req, res) => {
  try {
    const paginationData = await paginationQuery(req.query);
    const [faqData, totalCount] = await Promise.all([
      Faq.find({ isDeleted: false })
        .skip(paginationData.skip)
        .limit(paginationData.pageSize)
        .lean(true),
      Faq.countDocuments({ isDeleted: false }),
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
    return res.status(500).json({
      message: "Something went wrong .",
    });
  }
};

const postQuery = async (req, res) => {
  try {
    const query = new QueryModel(req.body);
    await query.save();
    res.status(201).json({ message: "Query sent successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const myBooking = async (req, res) => {
  try {
    const paginationData = await paginationQuery(req.query);

    const [bookingData, totalCount] = await Promise.all([
      JobBooking.find({ jobPostedBy: req.user._id, isDeleted: false })
        .skip(paginationData.skip)
        .limit(paginationData.pageSize)
        .lean(true),
      JobBooking.countDocuments({ jobPostedBy: req.user._id }),
    ]);

    const formatDate = (date) => {
      if (!date) return null;
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    for (let data of bookingData) {
      const uteName = await UteModel.findOne(
        { _id: data.uteId },
        { fullName: 1 }
      ).lean(true);

      data["uteName"] = uteName.fullName;
      data["bookingDateAndTime"] = formatDate(data.createdAt);
    }

    const paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCount,
    };
    const getPagination = await pagination(paginationObj);

    if (bookingData.length) {
      return res.status(200).send({
        data: bookingData,
        current: bookingData.length,
        totalCount,
        pagination: getPagination,
        message: "Your all bookings data retrived successfully!",
      });
    }

    return res.status(200).send({ data: [], message: "No jobs found" });
  } catch (error) {
    res.status(400).json({ error: "Something went wrong ." });
  }
};

const jobBookingDetail = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await JobBooking.findOne({ _id: id }).lean(true);
    if (!data) {
      return res.status(404).json({ message: "Booking not found" });
    }
    return res.status(200).json({
      message: "Booking detail retrieved successfully!",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong." });
  }
};

const userLikedUte = async (req, res) => {
  try {
    const { liked } = req.body;
    const uteId = req.params.id;
    if (!uteId) {
      return res.status(400).json({
        success: false,
        message: "Valid UTE ID is required.",
      });
    }
    const uteExists = await UteModel.exists({ _id: uteId });
    if (!uteExists) {
      return res.status(404).json({
        success: false,
        message: "UTE not found.",
      });
    }
    UserModel.updateOne(
      { _id: req.user._id },
      liked
        ? { $addToSet: { favoriteUtes: uteId } }
        : { $pull: { favoriteUtes: uteId } }
    ).then((updateResult) => {
      if (!updateResult.matchedCount) {
        return res.status(404).json({ message: "User not found." });
      }
      res.status(200).json({
        message: liked ? "Added to favourites." : "Removed from favourites.",
        data: { liked },
      });
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong . please try again later .",
    });
  }
};

const getFavouriteUte = async (req, res) => {
  try {
    let data = {};
    const user = await UserModel.findOne({ _id: req.user._id }).select(
      "favoriteUtes"
    );
    const paginationData = await paginationQuery(req.query);
    const [favoriteUtes, totalCounts] = await Promise.all([
      UteModel.find(
        { _id: { $in: user.favoriteUtes } },
        {
          isDeleted: 0,
          createdAt: 0,
          updatedAt: 0,
          __v: 0,
          status: 0,
          isActive: 0,
        }
      )
        .skip(paginationData.skip)
        .limit(paginationData.pageSize)
        .lean(true),
      UteModel.countDocuments({ _id: { $in: user.favoriteUtes } }),
    ]);
    const updatedFavorites = favoriteUtes.map((ute) => ({
      ...ute,
      liked: true,
    }));
    data.favorites = updatedFavorites;
    let paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCounts,
    };
    const getPagination = await pagination(paginationObj);
    return res.status(200).json({
      message: "All your favorite Utes retrieved successfully!",
      data: data,
      pagination: getPagination,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Something went wrong . please try again later ." });
  }
};

const uteLikeJob = async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const { liked } = req.body;
    UserModel.updateOne(
      { _id: req.user._id },
      liked
        ? { $addToSet: { favoriteJob: jobId } }
        : { $pull: { favoriteJob: jobId } }
    ).then((updateResult) => {
      if (!updateResult.matchedCount) {
        return res.status(404).json({ message: "User not found." });
      }
      res.status(200).json({
        message: liked ? "Added to favourites." : "Removed from favourites.",
      });
    });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong." });
  }
};

const getFavouriteJob = async (req, res) => {
  try {
    const user = await UserModel.findOne({ _id: req.user._id })
      .select("favoriteJob")
      .lean(true);
    if (!user || !user.favoriteJob?.length) {
      return res.status(200).json({
        message: "No favorite jobs found.",
        data: [],
      });
    }
    const paginationData = await paginationQuery(req.query);
    const [favJobData, totalCounts] = await Promise.all([
      JobModel.find(
        { _id: { $in: user.favoriteJob } },
        {
          title: 1,
          description: 1,
          workSchedule: 1,
          jobImg: 1,
          liked: 1,
        }
      )
        .skip(paginationData.skip)
        .limit(paginationData.pageSize)
        .lean(true),
      JobModel.countDocuments({ _id: { $in: user.favoriteJob } }),
    ]);
    let paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCounts,
    };
    const getPagination = await pagination(paginationObj);
    return res.status(200).json({
      message: "All your favorite jobs retrieved successfully!",
      data: favJobData.map((job) => ({ ...job, liked: true })),
      pagination: getPagination,
    });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const userApplyUte = async (req, res) => {
  try {
    const findUte = await UteModel.findOne({ _id: req.params.id }).lean(true);

    if (!findUte) {
      return res
        .status(400)
        .json({ message: "This ute is not available or deleted." });
    }

    if (!findUte.isUteAvailable) {
      return res.status(400).json({
        message: "This Ute is already booked, please booked other UTE",
      });
    }

    const [findUser, getOwnerInfo] = await Promise.all([
      UserModel.findOne({ _id: req.user._id }).lean(true),
      UserModel.findOne(
        { _id: findUte.createdBy, isDeleted: false },
        { firstName: 1, lastName: 1, email: 1 }
      ).lean(true),
    ]);

    const createdId = req?.user?._id.toString();
    const bookingId = `BOOKINAUS${createdId?.slice(-5)}`;

    const checkBookingId = await UteBooking.countDocuments({
      bookingBy: req.user._id,
      uteId: req.params.id,
      isUteDelivered: false,
    });

    if (checkBookingId) {
      return res
        .status(400)
        .json({ message: "You have already applied for this job ." });
    }

    if (!checkBookingId) {
      UteModel.updateOne(
        { _id: req.params.id },
        { $inc: { noOfUteOffer: 1 } }
      ).then();
    }

    const mailVariables = {
      "%fullName%": `${getOwnerInfo?.firstName} ${getOwnerInfo?.lastName}`,
      "%toName%": `${findUser?.firstName} ${findUser?.lastName}`,
    };

    sendMail("ute-booking-by-user", mailVariables, getOwnerInfo?.email);

    const data = await UteBooking.create({
      pickupAddress: req.body?.pickupAddress,
      name: req.body?.name,
      dropAddress: req.body?.dropAddress,
      uteName: findUte?.fullName,
      email: findUser?.email,
      phoneNumber: findUser?.phoneNumber,
      uteId: findUte?._id,
      bookingId: bookingId,
      utePostedBy: findUte?.createdBy,
      uteImages: findUte?.uteImages,
      bookingBy: req.user._id,
      bookingStatus: "pending",
      amount: Number(findUte.budget),
      requestAmount: req.body.requestAmount,
    });

    return res.status(201).json({
      message: "You have successfully applied for this ute .",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong . please try again later .",
    });
  }
};

const myUteBooking = async (req, res) => {
  try {
    const paginationData = await paginationQuery(req.query);

    const [bookingData, totalCount] = await Promise.all([
      UteBooking.find({ utePostedBy: req.user._id.toString() })
        .skip(paginationData.skip)
        .limit(paginationData.pageSize)
        .lean(true),
      UteBooking.countDocuments({ utePostedBy: req.user._id.toString() }),
    ]);

    const formatDate = (date) => {
      if (!date) return null;
      const d = new Date(date);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    };

    const formattedBookingData = bookingData.map((item) => ({
      ...item,
      bookingDateAndTime: formatDate(item.createdAt),
    }));

    const paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCount,
    };
    const getPagination = await pagination(paginationObj);

    return res.status(200).send({
      data: formattedBookingData,
      current: bookingData.length,
      totalCount,
      pagination: getPagination,
      message: "Your all bookings data retrieved successfully!",
    });
  } catch (error) {
    res
      .status(400)
      .json({ error: "Something went wrong . please try again later ." });
  }
};

const uteAcceptBooking = async (req, res) => {
  try {
    const [uteOwner, uteBooking] = await Promise.all([
      UserModel.findOne({ _id: req.user._id, role: "uteOwner" }).lean(true),
      UteBooking.findOne(
        { _id: req.params.id },
        { uteId: 1, bookingBy: 1 }
      ).lean(true),
    ]);

    const bookingStatus = req.body.bookingStatus.toLowerCase();

    if (uteBooking) {
      const [getUteInfo, getUteOwner] = await Promise.all([
        UteModel.findOne({ _id: uteBooking.uteId }, { fullName: 1 }).lean(true),
        UserModel.findOne(
          { _id: uteBooking.bookingBy },
          { firstName: 1, lastName: 1, email: 1 }
        ).lean(true),
      ]);

      const mailVariables = {
        "%fullName%": `${getUteOwner?.firstName} ${getUteOwner?.lastName}`,
        "%toName%": `${uteOwner?.firstName} ${uteOwner?.lastName}`,
        "%uteName%": `${getUteInfo?.fullName}`,
      };

      sendMail("accept-by-ute-owner", mailVariables, getUteOwner?.email);
    }

    UteBooking.updateOne(
      { _id: req.params.id },
      {
        $set: {
          bookingStatus: bookingStatus,
          uteOwnerName: uteOwner?.firstName,
          uteOwnerEmail: uteOwner?.email,
        },
      }
    ).then();

    return res.status(200).json({
      message: `You have ${bookingStatus} this booking .`,
    });
  } catch (error) {
    console.log("errorerror", error);

    res.status(500).send({ message: "Something went wrong ." });
  }
};

const uteOwnerAcceptedBoookings = async (req, res) => {
  try {
    const paginationData = await paginationQuery(req.query);

    const [bookingData, totalCount] = await Promise.all([
      UteBooking.find({ bookingBy: req.user._id, bookingStatus: "accept" })
        .skip(paginationData.skip)
        .limit(paginationData.pageSize)
        .lean(true),
      UteBooking.countDocuments({
        bookingBy: req.user._id,
        bookingStatus: "accept",
      }),
    ]);

    const paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCount,
    };
    const getPagination = await pagination(paginationObj);

    return res.status(200).send({
      data: bookingData,
      current: bookingData.length,
      totalCount,
      pagination: getPagination,
      message: bookingData.length
        ? "Accepted bookings retrieved successfully."
        : "No ute booking found",
    });
  } catch (error) {
    return res.status(500).send({
      message: "Something went wrong . please try again later.",
    });
  }
};

const jobAcceptBooking = async (req, res) => {
  try {
    const jobUser = await UserModel.findOne(
      { _id: req.user._id, role: "user" },
      {}
    );
    const bookingStatus = req.body.bookingStatus.toLowerCase();
    JobBooking.updateOne(
      { _id: req.params?.id },
      {
        $set: {
          bookingStatus: bookingStatus,
          jobUserName: jobUser?.firstName,
          jobUserEmail: jobUser?.email,
        },
      }
    ).then();

    return res.status(200).json({
      message: `You have ${bookingStatus} this booking .`,
    });
  } catch (error) {
    res.status(500).send({ message: "Something went wrong ." });
  }
};

const jobChangePaymentStatus = async (req, res) => {
  try {
    const jobUser = await UserModel.findOne(
      { _id: req.user._id, role: "user" },
      {}
    );
    const paymentStatus = req.body.paymentStatus;
    JobBooking.updateOne(
      { _id: req.params?.id },
      {
        $set: {
          paymentStatus: paymentStatus,
          jobUserName: jobUser?.firstName,
          jobUserEmail: jobUser?.email,
        },
      }
    ).then();
    return res.status(200).json({
      message: `You have ${paymentStatus} this booking .`,
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Something went wrong . please try again later." });
  }
};

const uteOwnerChangePaymentStatus = async (req, res) => {
  try {
    const uteOwner = await UserModel.findOne(
      { _id: req.user._id, role: "ute owner" },
      {}
    );
    const paymentStatus = req.body.paymentStatus;
    UteBooking.updateOne(
      { _id: req.params?.id },
      {
        $set: {
          paymentStatus: paymentStatus,
          uteOwnerName: uteOwner?.firstName,
          uteOwnerEmail: uteOwner?.email,
        },
      }
    ).then();
    return res.status(200).json({
      message: `You have ${paymentStatus} this booking .`,
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Something went wrong . please try again later." });
  }
};

const myJobApplyList = async (req, res) => {
  try {
    const userId = req?.user?._id.toString();
    const uteUserId = `BOOKINAUS${userId?.slice(-5)}`;
    const paginationData = await paginationQuery(req.query);

    const [allJobBooking, totalCount] = await Promise.all([
      JobBooking.find({ bookingId: uteUserId })
        .skip(paginationData.skip)
        .limit(paginationData.pageSize)
        .lean(true),
      JobBooking.countDocuments({ bookingId: uteUserId }),
    ]);

    const paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCount,
    };
    const getPagination = await pagination(paginationObj);
    return res.status(200).json({
      message: "All your job booking data retrieved successfully!",
      data: allJobBooking,
      totalCount,
      paginationData: getPagination,
    });
  } catch (error) {
    res.status(500).send({ message: "Something went wrong ." });
  }
};

const myUteApplyList = async (req, res) => {
  try {
    const userId = req?.user?._id.toString();
    const uteUserId = `BOOKINAUS${userId?.slice(-5)}`;
    const paginationData = (await paginationQuery(req.query)) || {
      skip: 0,
      limit: 10,
      page: 1,
      pageSize: 10,
    };
    const [allUteBooking, totalCount] = await Promise.all([
      UteBooking.find({ bookingId: uteUserId })
        .skip(paginationData.skip)
        .limit(Number(req.query.limit) || 10)
        .lean(true),
      UteBooking.countDocuments({ bookingId: uteUserId }),
    ]);

    const paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCount,
    };
    const getPagination = await pagination(paginationObj);
    return res.status(200).json({
      message: "All your ute booking data retrieved successfully!",
      data: allUteBooking,
      totalCount,
      paginationData: getPagination,
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Something went wrong . please try again later." });
  }
};

const userDashboardApi = async (req, res) => {
  try {
    const [totalUte, totalJob, totalUteBookings, totalJobBookings] =
      await Promise.all([
        UteModel.countDocuments({ createdBy: req.user._id }).lean(),
        JobModel.countDocuments({ createdBy: req.user._id }).lean(),
        UteBooking.countDocuments({ utePostedBy: req.user._id.toString() }),
        JobBooking.countDocuments({
          jobPostedBy: req.user._id,
          isDeleted: false,
        }),
      ]);

    const totalEnquiry = totalUteBookings + totalJobBookings;
    return res.status(200).json({
      message: "All your data repor t retrieved successfully!",
      data: { totalUte, totalJob, totalEnquiry },
    });
  } catch (error) {
    return res.status(500).send({
      message: "Something went wrong. please try again later .",
    });
  }
};

const placeUte = async (req, res) => {
  try {
    const [jobs, user] = await Promise.all([
      JobModel.findOne(
        { _id: req.params.id, isDeleted: false },
        { budget: 1 }
      ).lean(true),
      UserModel.findOne({ _id: req.user._id }, { customerId: 1 }),
    ]);

    if (!jobs) {
      return res.status(400).send({ message: "Jobs not found" });
    }

    const paymentIntents = await createPaymentIntends(
      user?.customerId,
      (req.body.amount * 1.1).toFixed(2) * 1
    );

    let dataObj = {
      amount: paymentIntents.data.amount,
      paymentIntentId: paymentIntents.data.id,
      jobId: jobs._id,
      bookingId: req.body.bookingId,
      sendMailBy: req.body.sendMailId,
      status: paymentIntents.data.status,
      customer: user?.customerId,
      paymentBy: user._id,
    };

    await Payment.create(dataObj);

    dataObj["clientSecret"] = paymentIntents?.data?.client_secret;

    return res
      .status(200)
      .send({ data: dataObj.clientSecret, message: "place ute successfully" });
  } catch (error) {
    return res
      .status(500)
      .send({ message: "Something went wrong . please try again later" });
  }
};

const getMyJobs = async (req, res) => {
  try {
    const jobs = await JobModel.find({
      isDeleted: false,
      createdBy: req.user._id,
    }).lean(true);

    return res.status(200).send({
      data: jobs,
      message: jobs.length ? "Jobs received successfully" : "No jobs found",
    });
  } catch (error) {
    return res.status(500).send({ message: "Internal Server Error" });
  }
};

const payUte = async (req, res) => {
  try {
    const [booking, user] = await Promise.all([
      UteBooking.findOne(
        { _id: req.params.id, isDeleted: false },
        { amount: 1, utePostedBy: 1, requestAmount: 1 }
      ).lean(true),
      UserModel.findOne({ _id: req.user._id }, { customerId: 1 }).lean(true),
    ]);

    if (!booking) {
      return res.status(400).send({ message: "UTE booking not found" });
    }

    const paymentIntents = await createPaymentIntends(
      user?.customerId,
      (booking.requestAmount * 1.1).toFixed(2) * 1
    );

    let dataObj = {
      amount: paymentIntents.data.amount,
      paymentIntentId: paymentIntents.data.id,
      bookingId: booking._id,
      sendMailBy: booking.utePostedBy,
      status: paymentIntents.data.status,
      customer: user?.customerId,
      paymentBy: user._id,
    };

    await Payment.create(dataObj);

    dataObj["clientSecret"] = paymentIntents?.data?.client_secret;

    return res
      .status(200)
      .send({ data: dataObj.clientSecret, message: "place ute successfully" });
  } catch (error) {
    console.log("errorerrorerror", error);

    return res
      .status(500)
      .send({ message: "Something went wrong . please try again later" });
  }
};

const jobAllAcceptedBookings = async (req, res) => {
  try {
    const paginationData = await paginationQuery(req.query);
    const user = req?.user?._id;
    const bookingId = `BOOKINAUS${user.slice(-5)}`;
    const [bookingData, totalCount] = await Promise.all([
      UteBooking.find({
        bookingId: bookingId,
        bookingStatus: "Accept",
      })
        .skip(paginationData.skip)
        .limit(paginationData.pageSize)
        .lean(true),
      UteBooking.countDocuments({
        bookingId: bookingId,
        bookingStatus: "Accept",
      }),
    ]);

    const paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCount,
    };
    const getPagination = await pagination(paginationObj);

    return res.status(200).send({
      data: bookingData,
      current: bookingData.length,
      totalCount,
      pagination: getPagination,
      message: "Accepted bookings retrieved successfully.",
    });
  } catch (error) {
    return res.status(500).send({
      message: "Something went wrong . please try again later.",
    });
  }
};

const myUteBookingList = async (req, res) => {
  try {
    if (req.user.role !== "uteOwner") {
      return res
        .status(400)
        .send({ message: "You cannot access these functionality" });
    }

    let paginationData = await paginationQuery(req.query);

    let [bookingData, totalCount] = await Promise.all([
      UteBooking.aggregate([
        {
          $match: {
            utePostedBy: new mongoose.Types.ObjectId(req.user._id),
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
        utePostedBy: req.user._id,
        status: { $in: ["inProgress", "delivered"] },
      }),
    ]);

    const paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCount,
    };
    const getPagination = await pagination(paginationObj);

    return res.status(200).send({
      data: bookingData,
      current: bookingData.length,
      totalCount,
      pagination: getPagination,
      message: bookingData.length
        ? "Accepted bookings retrieved successfully."
        : "No ute booking found",
    });
  } catch (error) {
    return res.status(500).send({
      message: "Something went wrong . please try again later.",
    });
  }
};

const deliveredByUte = async (req, res) => {
  try {
    if (req.user.role !== "uteOwner") {
      return res
        .status(400)
        .send({ message: "You are not access this functionality" });
    }

    const [getBooking, getJobDelivered] = await Promise.all([
      UteBooking.findOne(
        { _id: req.params.id, isDeleted: false, status: "inProgress" },
        { uteId: 1 }
      ).lean(true),
      JobBooking.findOne(
        { _id: req.params.id, isDeleted: false, status: "inProgress" },
        { uteId: 1 }
      ).lean(true),
    ]);

    if (!getBooking && !getJobDelivered) {
      return res.status(400).send({ message: "Booking not found" });
    }

    await Promise.all([
      UteBooking.updateOne(
        { _id: getBooking?._id },
        { $set: { status: "delivered", isUteDelivered: true } }
      ),
      JobBooking.updateOne(
        { _id: getJobDelivered?._id },
        { $set: { status: "delivered" } }
      ),
      UteModel.updateOne(
        {
          $or: [{ _id: getBooking?.uteId }, { _id: getJobDelivered?.uteId }],
        },
        { $set: { isUteAvailable: true } }
      ),
    ]);

    return res.status(200).send({
      message: "Ute delivered successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      message: "Something went wrong . please try again later.",
    });
  }
};

const myUte = async (req, res) => {
  try {
    let paginationData = await paginationQuery(req.query);

    let [bookingData, totalCount] = await Promise.all([
      UteBooking.aggregate([
        {
          $match: {
            bookingBy: new mongoose.Types.ObjectId(req.user._id),
            status: { $in: ["inProgress", "delivered"] },
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
            pickupAddress: 1,
            dropAddress: 1,
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
        utePostedBy: req.user._id,
        status: { $in: ["inProgress", "delivered"] },
      }),
    ]);

    const paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCount,
    };
    const getPagination = await pagination(paginationObj);

    return res.status(200).send({
      data: bookingData,
      current: bookingData.length,
      totalCount,
      pagination: getPagination,
      message: bookingData.length
        ? "My bookings retrieved successfully."
        : "No booking found",
    });
  } catch (error) {
    return res.status(500).send({
      message: "Something went wrong . please try again later.",
    });
  }
};

const myJobStatus = async (req, res) => {
  try {
    let paginationData = await paginationQuery(req.query);

    let [bookingData, totalCount] = await Promise.all([
      JobBooking.aggregate([
        {
          $match: {
            jobPostedBy: new mongoose.Types.ObjectId(req.user._id),
            status: { $in: ["inProgress", "delivered"] },
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
            jobTitle: 1,
            requestPrice: 1,
            status: 1,
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
        jobPostedBy: req.user._id,
        status: { $in: ["inProgress", "delivered"] },
      }),
    ]);

    const paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCount,
    };
    const getPagination = await pagination(paginationObj);

    return res.status(200).send({
      data: bookingData,
      current: bookingData.length,
      totalCount,
      pagination: getPagination,
      message: bookingData.length
        ? "My jobs retrieved successfully."
        : "No jobs found",
    });
  } catch (error) {
    return res.status(500).send({
      message: "Something went wrong . please try again later.",
    });
  }
};

const myJobRequest = async (req, res) => {
  try {
    if (req.user.role !== "uteOwner") {
      return res
        .status(400)
        .send({ message: "You cannot access these functionality" });
    }

    let paginationData = await paginationQuery(req.query);

    let [bookingData, totalCount] = await Promise.all([
      JobBooking.aggregate([
        {
          $match: {
            createdBy: new mongoose.Types.ObjectId(req.user._id),
            status: { $in: ["inProgress", "delivered"] },
          },
        },
        {
          $lookup: {
            from: "users",
            let: { jobPostedBy: "$jobPostedBy" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$jobPostedBy"] },
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
            requestPrice: 1,
            pickupAddress: 1,
            dropAddress: 1,
            isUteDispatch: 1,
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
        createdBy: req.user._id,
        status: { $in: ["inProgress", "delivered"] },
      }),
    ]);

    const paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCount,
    };
    const getPagination = await pagination(paginationObj);

    return res.status(200).send({
      data: bookingData,
      current: bookingData.length,
      totalCount,
      pagination: getPagination,
      message: bookingData.length
        ? "Job request retrieved successfully."
        : "No job request found",
    });
  } catch (error) {
    return res.status(500).send({
      message: "Something went wrong . please try again later.",
    });
  }
};

const uteDispatch = async (req, res) => {
  try {
    if (req.user.role !== "uteOwner") {
      return res
        .status(400)
        .send({ message: "You are not access this functionality" });
    }

    const getBooking = (
      await JobBooking.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(req.params.id),
            isDeleted: false,
            status: "inProgress",
          },
        },
        {
          $lookup: {
            from: "users",
            let: { userId: "$jobPostedBy" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$_id", "$$userId"] },
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
            firstName: "$users.firstName",
            lastName: "$users.lastName",
            email: "$users.email",
            uteName: "$ute.fullName",
          },
        },
      ])
    )[0];

    if (!getBooking) {
      return res.status(400).send({ message: "Booking not found" });
    }

    JobBooking.updateOne(
      { _id: getBooking._id },
      { $set: { isUteDispatch: true } }
    ).then();

    const mailVariables = {
      "%firstName%": getBooking.firstName,
      "%lastName%": getBooking.lastName,
      "%uteName%": getBooking.uteName,
    };

    sendMail("ute-dispatch-notification", mailVariables, getBooking.email);

    return res.status(200).send({
      message: "Ute dispatch successfully",
    });
  } catch (error) {
    return res.status(500).send({
      message: "Something went wrong . please try again later.",
    });
  }
};

const createAccount = async (req, res) => {
  try {
    const users = await UserModel.findOne(
      { _id: req.user._id, isDeleted: false },
      { accountId: 1 }
    ).lean(true);

    let obj = {
      email: req.user.email,
      origin: req.headers.origin,
    };

    if (users?.accountId) {
      obj["id"] = users.accountId;
    }

    const accounts = await createConnectAccount(obj);

    UserModel.updateOne(
      { _id: req.user._id, isDeleted: false, accountId: { $exists: false } },
      { $set: { accountId: accounts.accountId } }
    ).then();

    return res.status(accounts.status).send({
      data: accounts.url,
      message: accounts.message,
    });
  } catch (error) {
    APIErrorLog.error("Error while create the stripe connect accounts");
    APIErrorLog.error(error);
    return res.status(500).send({ message: error });
  }
};

const getAccountDetails = async (req, res) => {
  try {
    const user = await UserModel.findOne(
      { _id: req.user._id },
      { accountId: 1 }
    ).lean(true);

    if (!user?.accountId) {
      return res.status(400).send({ message: "Account Id not found" });
    }

    const account = await getAccounts(user.accountId);

    if (account && account.data.payouts_enabled) {
      return res.status(200).send({
        data: account.data,
        message: "Account data received successfully",
      });
    }

    return res.status(400).send({ message: "Payout not enabled" });
  } catch (error) {
    APIErrorLog.error("Error while get the account details.");
    APIErrorLog.error(error);
    return res.status(500).send({ message: error });
  }
};

const getConnectAccountDashBoardLink = async (req, res) => {
  try {
    const user = await UserModel.findOne(
      { _id: req.user._id },
      { accountId: 1 }
    ).lean(true);

    if (!user?.accountId) {
      return res.status(400).send({ message: "Account Id not found" });
    }

    const data = await getConnectAccountDashBoardLinkFn(user.accountId);

    return res.status(200).send({ data: data.data.url });
  } catch (error) {
    APIErrorLog.error("Error from getConnectAccountDashBoardLink ");
    APIErrorLog.error(error);
    return res.status(500).send({ message: "Something went wrong" });
  }
};

module.exports = {
  register,
  login,
  sendForgotPasswordOTP,
  validOtp,
  resetPassword,
  changePassword,
  postJob,
  jobLists,
  jobDetail,
  sendEmailOtp,
  verifyEmailOtp,
  checkToken,
  updateProfile,
  getUserProfile,
  allUte,
  uteByLocation,
  userJoblist,
  relatedTownInUte,
  allBlog,
  blogDetail,
  likedDislikedBlog,
  favouriteBlog,
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
  uteOwnerAcceptedBoookings,
  jobAcceptBooking,
  myJobApplyList,
  myUteApplyList,
  jobChangePaymentStatus,
  uteOwnerChangePaymentStatus,
  userDashboardApi,
  jobBookingDetail,
  placeUte,
  getMyJobs,
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
  getConnectAccountDashBoardLink,
};

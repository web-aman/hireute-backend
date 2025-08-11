const {
  fileUploadFunc,
  paginationQuery,
  pagination,
} = require("../functions/common");
const UteModel = require("../models/UteModel");
const UserModel = require("../models/UserModel");
const JobBooking = require("../models/JobBookingModel");
const JobModel = require("../models/JobModel");
const { sendMail } = require("../functions/mailer");
const UteBookingModel = require("../models/UteBookingModel");
const postUte = async (req, res) => {
  try {
    const id = req?.params?.id;
    const step = parseInt(req.body.step);

    const userId = req.user._id;

    if (!id && step !== 1) {
      return res
        .status(400)
        .json({ message: "New records must start at step 1" });
    }
    if (step && ![1, 2, 3, 4].includes(step)) {
      return res.status(400).json({ message: "Invalid step" });
    }

    let fileData;
    if (req.files && req.files.length > 0) {
      fileData = await fileUploadFunc(req, res);
      if (fileData.type !== "success") {
        return res.status(fileData.status).json({
          message:
            fileData.type === "fileNotFound"
              ? "Please upload the image"
              : fileData.type,
        });
      }
    }

    const uteImages = req?.files?.uteImages?.map((item) => item.filename) || [];
    let uteData, responseData;

    if (id) {
      uteData = await UteModel.findOne({ _id: id });
      if (!uteData) {
        return res.status(404).json({ message: "Ute record not found" });
      }
      if (step && uteData.completeStep && step > uteData.completeStep + 1) {
        return res.status(400).json({
          message: `Please complete step ${
            uteData.completeStep + 1
          } before proceeding to step ${step}`,
        });
      }
    }

    switch (step) {
      case 1:
        const step1Data = {
          fullName: req.body.fullName,
          description: req.body.description,
          licenceNumber: req.body.licenceNumber,
          licenceExpireDate: req.body.licenceExpireDate,
          createdBy: userId,
          completeStep: 1,
        };

        if (!id) {
          responseData = await UteModel.create(step1Data);
          await UserModel.updateOne(
            { _id: userId },
            {
              $set: { role: "uteOwner" },
            }
          );
          UserModel.updateOne(
            {
              _id: req.user._id,
            },
            {
              $set: {
                role: "uteOwner",
              },
            }
          ).then();
        } else {
          responseData = await UteModel.findOneAndUpdate(
            { _id: id },
            { $set: step1Data },
            { new: true }
          );
        }
        break;

      case 2:
        responseData = await UteModel.findOneAndUpdate(
          { _id: id },
          {
            $set: {
              serviceCity: req.body.serviceCity,
              state: req.body.state,
              location: req.body.location,
              latitude: req.body.latitude,
              longitude: req.body.longitude,

              completeStep: 2,
            },
          },
          { new: true }
        );
        await UserModel.updateOne(
          { _id: userId },
          { $addToSet: { location: req.body.location } }
        );
        break;

      case 3:
        responseData = await UteModel.findOneAndUpdate(
          { _id: id },
          {
            $set: {
              uteModel: req.body.uteModel,
              chesisNumber: req.body.chesisNumber,
              uteAvailble: req.body.uteAvailble,
              uteImages: uteImages,
              completeStep: 3,
            },
          },
          { new: true }
        );
        break;

      case 4:
        responseData = await UteModel.findOneAndUpdate(
          { _id: id },
          {
            $set: {
              budget: req.body.budget,
              priceType: req.body.priceType,
              weight: req.body.weight,
              weightUnit: req.body.weightUnit,
              seat: req.body.seat,
            },
            $unset: { completeStep: "" },
          },
          { new: true }
        );
        break;

      default:
        return res
          .status(400)
          .json({ message: "Step is required for updates" });
    }

    const statusCode = !id && step === 1 ? 201 : 200;

    const response = {
      message:
        step === 4
          ? "Ute registration completed successfully"
          : `Ute step ${step} completed successfully`,
      data: responseData,
      uteId: responseData._id,
      currentStep: step === 4 ? null : step,
    };

    return res.status(statusCode).json(response);
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong . please try again later.",
    });
  }
};

const updateUte = async (req, res) => {
  try {
    const id = req?.params?.id;
    const step = parseInt(req.body.step);
    const userId = req.user._id;

    if (!id && step !== 1) {
      return res
        .status(400)
        .json({ message: "New records must start at step 1" });
    }
    if (step && ![1, 2, 3, 4].includes(step)) {
      return res.status(400).json({ message: "Invalid step" });
    }

    let fileData;
    if (req.files && req.files.length > 0) {
      fileData = await fileUploadFunc(req, res);
      if (fileData.type !== "success") {
        return res.status(fileData.status).json({
          message:
            fileData.type === "fileNotFound"
              ? "Please upload the image"
              : fileData.type,
        });
      }
    }

    const uteImages = req?.files?.uteImages?.map((item) => item.filename) || [];
    let uteData;

    if (id) {
      uteData = await UteModel.findOne({ _id: id });
      if (!uteData) {
        return res.status(404).json({ message: "Ute record not found" });
      }
    }

    switch (step) {
      case 1:
        UteModel.updateOne(
          { _id: id },
          {
            $set: {
              fullName: req.body.fullName,
              description: req.body.description,
              licenceNumber: req.body.licenceNumber,
              licenceExpireDate: req.body.licenceExpireDate,
              createdBy: req.user._id,
            },
          }
        ).then();
        break;
      case 2:
        UteModel.updateOne(
          { _id: id },
          {
            $set: {
              serviceCity: req.body.serviceCity,
              state: req.body.state,
              location: req.body.location,
            },
          }
        ).then();
        break;
      case 3:
        await UteModel.updateOne(
          { _id: id },
          {
            $set: {
              uteModel: req.body.uteModel,
              chesisNumber: req.body.chesisNumber,
              uteAvailble: req.body.uteAvailble,
              uteImages: uteImages,
            },
          }
        ).then();
        break;
      case 4:
        UteModel.updateOne(
          { _id: id },
          { $set: { budget: req.body.budget }, $unset: { completeStep: "" } },
          { new: true }
        ).then();
        break;

      default:
        return res
          .status(400)
          .json({ message: "Step is required for updates" });
    }

    const response = {
      message: "ute update successfully !",
      currentStep: step === 4 ? null : step,
    };

    return res.status(201).json(response);
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong .",
    });
  }
};

const allUte = async (req, res) => {
  try {
    let { search, location } = req.query;
    let condition = {};
    if (search) {
      search = search.trim();
      if (search) {
        condition.fullName = {
          $regex: search,
          $options: "i",
        };
      }
    }
    condition.createdBy = req.user._id;

    const paginationData = await paginationQuery(req.query);
    const [allUte, totalCount] = await Promise.all([
      UteModel.find(condition)
        .skip(paginationData?.skip)
        .limit(req?.query?.limit)
        .lean(true),
      UteModel.countDocuments(condition),
    ]);

    const paginationObj = {
      page: paginationData.page,
      pageSize: paginationData.pageSize,
      total: totalCount,
    };
    const getPagination = await pagination(paginationObj);

    return res.status(200).json({
      message: "All your posted ute list",
      data: allUte,
      totalCount,
      paginationData: getPagination,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong . please try again later.",
    });
  }
};

const uteDetail = async (req, res) => {
  try {
    const userId = req.user?._id;
    const uteData = await UteModel.findOne(
      {
        createdBy: userId,
        completeStep: { $gte: 1, $lt: 4 },
      },
      {}
    ).lean();
    if (!uteData) {
      return res.status(200).json({
        message: "No incomplete utes found",
        data: null,
      });
    }

    return res.status(200).json({
      message: "Incomplete ute found successfully!",
      data: uteData,
      nextStep: uteData.completeStep + 1,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong . please try again later.",
    });
  }
};

const singleUteDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.query;
    if (!id) {
      return res.status(400).json({ message: "Ute ID not provided" });
    }
 
    let [uteData] = await Promise.all([
      UteModel.findOne({ _id: id }).lean(true),
      UteModel.updateOne({ _id: id }, { $inc: { views: 1 } }),
    ]);
 
    if (!uteData) {
      return res.status(404).json({ message: "No ute found", data: null });
    }
 
    let liked = false;
    uteData['isApplied'] = false
 
    if (req?.query?.userId) {
 
      const isUteBooking = await UteBookingModel.countDocuments({ bookingBy: req?.query?.userId, uteId: req.params.id, isUteDelivered: false })
 
      if (isUteBooking) {
        uteData['isApplied'] = true
      }
    }
 
    if (email) {
 
      const user = await UserModel.findOne({ email }).select("favoriteUtes").lean(true)
      liked = user?.favoriteUtes?.some((favId) => favId.toString() === id.toString()) || false;
    }
 
    uteData.liked = liked;
    return res.status(200).json({
      message: "Ute found successfully!",
      data: uteData,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong. Please try again later.",
    });
  }
};
 

const getUserListedUte = async (req, res) => {
  try {
    try {
      let { search } = req.query;
      let condition = {};
      condition.createdBy = req.user._id;
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

      const [uteData, totalCount] = await Promise.all([
        UteModel.find(condition)
          .skip(paginationData.skip)
          .limit(paginationData.pageSize)
          .lean(true),
        UteModel.countDocuments(condition),
      ]);

      const paginationObj = {
        page: paginationData.page,
        pageSize: paginationData.pageSize,
        total: totalCount,
      };
      const getPagination = await pagination(paginationObj);

      if (UteModel.length) {
        return res.status(200).send({
          data: uteData,
          current: uteData.length,
          totalCount,
          pagination: getPagination,
          message: "Ute list retrieved successfully !",
        });
      }
    } catch (error) {
      return res.status(500).send({ message: "Something went wrong" });
    }
  } catch (error) {
    return res.status(500).json({
      message: "Something went wrong . please try again later .",
    });
  }
};

const uteApplyJob = async (req, res) => {
  try {
    const [findJob, findUser, checkBookingId] = await Promise.all([
      JobModel.findOne({ _id: req.params.id }).lean(true),
      UserModel.findOne({ _id: req.user._id }).lean(true),
      JobBooking.countDocuments({ createdBy: req.user._id, jobId: req.params.id }),
      JobModel.updateOne({ _id: req.params.id }, { $inc: { noOfJobOffer: 1 } }),
    ]);
 
    if (!findJob || checkBookingId) {
      return res.status(400).send({
        message: !findJob ? "This job is not available or deleted." : "You have already applied for this job",
      });
    }
 
    let obj = {
      firstName: findUser.firstName,
      lastName: findUser.lastName,
      email: findUser.email,
      phoneNumber: findUser.phoneNumber,
      jobId: findJob._id,
      jobTitle: findJob.title,
      jobLocation: findJob.location,
      jobState: findJob.state,
      bookingId: `BOOKINAUS${req.user._id?.slice(-5)}`,
      jobPostedBy: findJob.createdBy,
      jobImg: findJob.jobImg,
      paymentStatus: "pending",
      uteId: req.body.uteId,
      amount: Number(findJob.budget),
      createdBy: findUser._id,
    }
 
    const [bookingDetail, sendMailToUser] = await Promise.all([
      JobBooking.create(obj),
      UserModel.findOne({ _id: findJob.createdBy }, { firstName: 1, lastName: 1, email: 1 }).lean(true)
    ]);
 
    const mailVariables = {
      "%fullName%": `${sendMailToUser?.firstName} ${sendMailToUser?.lastName}`,
      "%toName%": `${findUser?.firstName} ${findUser?.lastName}`,
      "%jobName%": `${bookingDetail?.jobTitle}`,
      "%link%": `${process.env.URL}/job-request`,
    };
 
    sendMail("requested-job", mailVariables, sendMailToUser.email);
 
    return res.status(201).json({
      message: "You have successfully applied for a job .",
      data: bookingDetail,
    });
 
  } catch (error) {
    res.status(500).send({ message: "Something went wrong . please try again later ." });
  }
};
 

module.exports = {
  postUte,
  allUte,
  uteDetail,
  getUserListedUte,
  singleUteDetail,
  updateUte,
  uteApplyJob,
};



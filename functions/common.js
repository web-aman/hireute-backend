const multer = require("multer");
const upload = require("./upload");

module.exports.generateRandomOTP = () => {
  try {
    const digits = "0123456789";
    let OTP = "";
    for (let i = 0; i < 6; i++) {
      OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
  } catch (error) {
    throw error;
  }
};

module.exports.paginationQuery = (data) => {
  try {
    const page = parseInt(data?.page) || 1;
    const pageSize = parseInt(data?.limit);
    const validPageSize = isNaN(pageSize) ? 10 : pageSize;
    const skip = (page - 1) * validPageSize;
 
    return {
      page,
      pageSize: validPageSize,
      skip,
    };
  } catch (error) {
    throw error;
  }
};

module.exports.pagination = (data) => {
  try {
    let obj = {};
    const totalPages = Math.ceil(data.total / data.pageSize);
    if (data.page > totalPages) {
      data.page = 1;
    }
    obj = {
      page: data.page,
      hasPrevious: data.page > 1,
      previous: data.page - 1,
      hasNext: data.page < totalPages,
      next: data.page < totalPages ? data.page + 1 : 0,
      totalPages,
    };
    return obj;
  } catch (error) {
    throw error;
  }
};

module.exports.fileUploadFunc = (request, response) => {
  return new Promise(async function (resolve, reject) {
    try {
      upload(request, response, (err) => {
        
        if (request.files && !Object.keys(request.files).length) {
          return resolve({
            type: "fileNotFound",
            status: 400,
          });
        }

        if (request.fileValidationError) {
          return resolve({
            type: request.fileValidationError,
            status: 400,
          });
        }

        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_UNEXPECTED_FILE") {
            return resolve({
              type: "Unexpected file field",
              status: 400,
            });
          }
        } else if (err) {
          return resolve({
            type: "File upload failed",
            status: 400,
          });
        }

        return resolve({
          type: "success",
          status: 200,
          data: request.files,
        });
      });
    } catch (error) {
      return reject(error);
    }
  });
};

module.exports.filterUsers = (data) => {
 
  //Declare the blank object
  let condition = { '$or': [] };
 
  if (data?.search) {
 
    //Remove space
    data.search = (data.search).replace(/[^a-zA-Z 0-9_@./&-]/g, '').trim();
 
    condition['$or'].push({
      email: {
        '$regex': data.search,
        '$options': 'i'
      },
    })
 
    if (/^\d+$/.test(data.search)) {
      condition['$or'].push({
        phone: {
          '$regex': data.search,
          '$options': 'i'
        },
      })
    }
 
    //Split the string
    const splitSearch = ((data.search).replace(/[^a-zA-Z ]/g, '').trim()).split(" ");
 
    if (splitSearch.length > 1 && splitSearch[0] != '') {
      condition['$or'].push({
        $and: [
          {
            firstName: {
              '$regex': splitSearch[0],
              '$options': 'i'
            }
          }, {
            lastName: {
              '$regex': splitSearch[1],
              '$options': 'i'
            }
          }
        ]
      })
    } else if (splitSearch[0] != '') {
      condition['$or'].push({
        firstName: {
          '$regex': splitSearch.join(' '),
          '$options': 'i'
        }
      }, {
        lastName: {
          '$regex': splitSearch.join(' '),
          '$options': 'i'
        }
      })
    }
  }
 
  if (!condition['$or'].length) {
    delete condition['$or']
  }
 
  //Resolve the process
  return condition;
};
 
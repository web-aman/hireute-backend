const { sendMail } = require("./mailer");

const Payment = require("../models/PaymentModel");
const User = require('../models/UserModel');
const JobBooking = require("../models/JobBookingModel");
const JobModel = require("../models/JobModel");
const UteModel = require("../models/UteModel");
const UteBooking = require("../models/UteBookingModel");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

module.exports.createPaymentIntends = (customerId, amount) => {
    return new Promise(async function (resolve, reject) {
        try {

            let obj = {};

            obj["amount"] = amount * 100
            obj["currency"] = "aud"
            obj["automatic_payment_methods"] = {
                enabled: true,
            }

            if (customerId) {
                obj["customer"] = customerId
            }

            const paymentIntent = await stripe.paymentIntents.create(obj);

            // Resolve the process
            return resolve({ status: 200, data: paymentIntent });
        } catch (error) {
            // Reject the process
            return reject(error);
        }
    });
};

module.exports.paymentIntentWebhookFunc = (body, signature, endpointSecret) => {
    return new Promise(async function (resolve, reject) {
        try {
            const event = await stripe.webhooks.constructEvent(
                body,
                signature,
                endpointSecret
            );
            const eventTypeObj = {
                "payment_intent.succeeded": event.data.object,
                "payment_intent.processing": event.data.object,
                "payment_intent.payment_failed": event.data.object,
            };

            if (!eventTypeObj.hasOwnProperty(event.type)) {
                return resolve({
                    status: 400,
                    message: `Unhandled event type ${event.type}`,
                });
            }

            const eventData = event?.data?.object;
            const payment = await Payment.findOne({ paymentIntentId: eventData?.id, isDeleted: false }).lean(true);

            const [userData, getUteOwner, getUteDetail, getUteBooking] = await Promise.all([
                User.findOne({ _id: payment?.paymentBy, isDeleted: false }, { firstName: 1, lastName: 1, email: 1 }).lean(true),
                User.findOne({ _id: payment?.sendMailBy, isDeleted: false }, { firstName: 1, lastName: 1, email: 1 }).lean(true),
                JobBooking.findOne({ _id: payment?.bookingId, isDeleted: false }, { uteId: 1 ,amount:1}).lean(true),
                UteBooking.findOne({ _id: payment?.bookingId, isDeleted: false }, { uteId: 1 ,amount:1}).lean(true)
            ])

            let obj = {
                status: eventData?.status,
                type: event?.type,
            };

            if (!payment) {
                return resolve({ status: 200, data: eventTypeObj[event.type] });
            }

            let tempObj = {
                'succeeded': 'payment-succeeded',
                'requires_payment_method': 'payment-failed',
            }

            if (event.type === 'payment_intent.payment_failed') {
                obj['status'] = 'failed'
            }

            if (["paid", "succeeded"].includes(eventData?.status)) {

                obj["charges"] = eventData?.latest_charge;

                if (getUteOwner) {

                    const getUteName = await UteModel.findOne({
                        $or: [
                            { _id: getUteDetail?.uteId },
                            { _id: getUteBooking?.uteId },
                        ]
                    }, { fullName: 1 }).lean(true)

                    const mailVariable = {
                        "%fullName%": `${getUteOwner.firstName} ${getUteOwner.lastName}`,
                        "%uteName%": getUteName.fullName
                    };

                    sendMail('booked-ute', mailVariable, getUteOwner.email);
                }
                await Promise.all([
                    Payment.updateOne({ _id: payment?._id, isDeleted: false }, { $set: obj }),
                    JobBooking.updateOne({ _id: payment?.bookingId }, { $set: { status: 'inProgress', paymentStatus: 'succeeded', requestPrice: Math.round(payment.amount / 100), amount: getUteDetail?.amount } }),
                    UteModel.updateOne(
                        {
                            $or: [
                                { _id: getUteDetail?.uteId },
                                { _id: getUteBooking?.uteId }
                            ]
                        },
                        {
                            $set: { isUteAvailable: false }
                        }
                    ),
                    JobModel.updateOne({ _id: payment?.jobId }, { $set: { isBooked: true } }),
                    UteBooking.updateOne({ _id: payment?.bookingId }, { $set: { status: 'inProgress', paymentStatus: 'succeeded', actualAmount: Math.round(payment.amount / 100,), amount: getUteBooking?.amount } }),
                ])
            }

            if (userData) {

                const mailVariable = {
                    "%fullName%": `${userData.firstName} ${userData.lastName}`,
                    "%amount%": Math.round(payment.amount / 100)
                };

                sendMail(tempObj[eventData?.status], mailVariable, userData.email);
            }

            // Resolve the process
            return resolve({
                status: 200,
                data: eventTypeObj[event.type],
            });
        } catch (error) {
            // Reject the process
            return reject(error);
        }
    });
};

module.exports.createCustomer = (data) => {
    return new Promise(async function (resolve, reject) {
        try {
            const customer = await stripe.customers.create({ name: data.fullName, email: data.email });
 
            // Resolve the process
            return resolve({ status: 200, data: customer.id });
        } catch (error) {
            // Reject the process
            return reject(error);
        }
    });
};
 
module.exports.createConnectAccount = (data) => {
    return new Promise(async function (resolve, reject) {
        try {
 
            let account = {
                ['id']: data?.id
            };
 
            if (!data?.id) {
                account = await stripe.accounts.create({
                    type: 'express',
                    country: 'AU',
                    email: data.email,
                    business_type: 'individual',
                    capabilities: {
                        transfers: { requested: true },
                    },
                });
            }
 
            const accountLink = await stripe.accountLinks.create({
                account: account.id,
                refresh_url: `${data.origin}/account`,
                return_url: `${data.origin}/account`,
                type: "account_onboarding",
            });
 
            // Resolve the process
            return resolve({
                status: 200,
                accountId: account.id,
                url: accountLink?.url,
                message: "Stripe connect account created successfully",
            });
        } catch (error) {
            // Reject the process
            return reject(error);
        }
    });
};
 
module.exports.getAccounts = (id) => {
    return new Promise(async function (resolve, reject) {
        try {
            const account = await stripe.accounts.retrieve(id);
 
            // Resolve the process
            return resolve({
                status: 200,
                data: account,
            });
        } catch (error) {
            // Reject the process
            return reject(error);
        }
    });
};
 
module.exports.getConnectAccountDashBoardLinkFn = (id) => {
    return new Promise(async function (resolve, reject) {
        try {
            const res = await stripe.accounts.createLoginLink(id);
 
            // Resolve the process
            return resolve({
                status: 200,
                data: res,
            });
        } catch (error) {
            // Reject the process
            return reject(error);
        }
    });
};
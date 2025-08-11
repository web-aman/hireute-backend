const { paymentIntentWebhookFunc } = require("../functions/payment");

const paymentIntentWebHook = async (req, res) => {
  const endpointSecret = process.env.ENDPOINT_INTENT;
  const signature = req.headers["stripe-signature"];
  try {
    const payment = await paymentIntentWebhookFunc(
      req.body,
      signature,
      endpointSecret
    );

    return res.status(payment.status).send({
      data: payment?.data,
      message: "webhooks ok",
    });
  } catch (error) {
    return res.status(500).send({ message: error });
  }
};

module.exports = {
  paymentIntentWebHook,
};




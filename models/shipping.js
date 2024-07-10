const mongoose = require("mongoose");

const shippingSchema = new mongoose.Schema({
  shippingName: {
    type: String,
  },
  shippingAddressLine1: {
    type: String,
  },
  shippingAddressLine2: {
    type: String,
  },
  apartment: {
    type: String,
    default: "",
  },
  zip: {
    type: String,
    default: "",
  },
  city: {
    type: String,
    default: "",
  },
  country: {
    type: String,
    default: "",
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

shippingSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

shippingSchema.set("toJSON", {
  virtuals: true,
});

exports.Shipping = mongoose.model("Shipping", shippingSchema);
exports.shippingSchema = shippingSchema;

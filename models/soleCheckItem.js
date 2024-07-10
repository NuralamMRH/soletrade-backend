const mongoose = require("mongoose");

const soleCheckItemSchema = mongoose.Schema({
  soleCheckBrand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SoleCheckBrand",
  },
  soleCheckModel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SoleCheckModel",
  },
  appearanceImage: {
    type: String,
    default: "",
  },
  insideLabelImage: {
    type: String,
    default: "",
  },
  insoleImage: {
    type: String,
    default: "",
  },
  insoleStitchImage: {
    type: String,
    default: "",
  },
  boxLabelImage: {
    type: String,
    default: "",
  },
  dateCodeImage: {
    type: String,
    default: "",
  },
  additionalImage: {
    type: String,
    default: "",
  },
  remarks: {
    type: String,
    default: "",
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  checkedStatus: {
    type: String,
    default: "NOT PASS",
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
});

soleCheckItemSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

soleCheckItemSchema.set("toJSON", {
  virtuals: true,
});

exports.SoleCheckItem = mongoose.model("SoleCheckItem", soleCheckItemSchema);

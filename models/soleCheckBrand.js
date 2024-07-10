const mongoose = require("mongoose");

const soleCheckBrandSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    default: "",
  },
});

soleCheckBrandSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

soleCheckBrandSchema.set("toJSON", {
  virtuals: true,
});

exports.SoleCheckBrand = mongoose.model("SoleCheckBrand", soleCheckBrandSchema);

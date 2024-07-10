const mongoose = require("mongoose");

const productSchema = mongoose.Schema({
  name: {
    type: String,
    default: "",
  },
  description: {
    type: String,
  },
  richDescription: {
    type: String,
    default: "",
  },
  image: {
    type: String,
    default: "",
  },
  images: [
    {
      type: String,
    },
  ],
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Brand",
  },
  model: {
    type: String,
    default: "",
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },

  attributeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Attribute",
  },

  variations: [
    {
      attributeOptionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AttributeOption",
      },
    },
  ],
  sku: {
    type: String,
    default: "",
  },
  colorway: {
    type: String,
    default: "",
  },
  mainColor: {
    type: String,
    default: "",
  },
  retailPrice: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 0,
  },
  numViews: {
    type: Number,
    default: 0,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },

  publishDate: {
    type: Date,
    default: Date.now,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
});

productSchema.virtual("id").get(function () {
  return this._id.toHexString();
});

productSchema.set("toJSON", {
  virtuals: true,
});

exports.Product = mongoose.model("Product", productSchema);

const { Brand } = require("../models/brand");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

//image upload
const multer = require("multer");
const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isValid = FILE_TYPE_MAP[file.mimetype];
    let uploadError = new Error("invalid image type");

    if (isValid) {
      uploadError = null;
    }
    cb(uploadError, "public/uploads");
  },
  filename: function (req, file, cb) {
    const fileName = file.originalname.split(" ").join("-");
    const extension = FILE_TYPE_MAP[file.mimetype];
    cb(null, `${fileName}-${Date.now()}.${extension}`);
  },
});

const uploadOptions = multer({ storage: storage });

router.get(`/`, async (req, res) => {
  const brandList = await Brand.find();

  if (!brandList) {
    res.status(500).json({ success: false });
  }
  res.status(200).send(brandList);
});

router.get("/:id", async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);

    if (!brand) {
      return res
        .status(404)
        .json({ message: "The brand with the given ID was not found." });
    }

    return res.status(200).send(brand);
  } catch (error) {
    // console.error("Error fetching product:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/", uploadOptions.single("image"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).send("No image in the request");

  const fileName = file.filename;
  const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

  let brand = new Brand({
    name: req.body.name,
    image: `${basePath}${fileName}`,
  });
  brand = await brand.save();

  if (!brand) return res.status(400).send("the brand cannot be created!");

  res.send(brand);
});

router.put("/:id", async (req, res) => {
  try {
    const checkedId = req.params.id;

    if (!mongoose.isValidObjectId(checkedId)) {
      return res.status(400).send("Invalid checked Id");
    }

    const updatedProduct = await SoleCheckItem.findByIdAndUpdate(
      checkedId,
      {
        checkedStatus: req.body.checkedStatus,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).send("SoleCheckItem not found");
    }

    res.send(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const brand = await Brand.findOneAndDelete({ _id: req.params.id });

    if (brand) {
      return res
        .status(200)
        .json({ success: true, message: "The brand is deleted!" });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "brand not found!" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

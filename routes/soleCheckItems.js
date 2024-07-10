const express = require("express");

const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const { SoleCheckBrand } = require("../models/soleCheckBrand");
const { SoleCheckItem } = require("../models/soleCheckItem");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
  "image/web": "web",
};

let uploadCount = 1; // Initialize the upload count

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
    const extension = FILE_TYPE_MAP[file.mimetype];
    const protocol = req.protocol; // Get the protocol from the request

    // Use the protocol to generate the new file name
    const newFileName = `soletrade-${Date.now()}-${uploadCount}.${extension}`;
    uploadCount++; // Increment the upload count for the next file

    // Combine the protocol, host, and file path
    const fullPath = `${protocol}://${req.get(
      "host"
    )}/public/uploads/${newFileName}`;

    cb(null, newFileName);
  },
});

const uploadOptions = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 100,
    fieldSize: 1024 * 1024 * 100,
  },
});

router.get(`/`, async (req, res) => {
  // localhost:3000/api/v1/products?categories=2342342,234234
  let filter = {};
  if (req.query.soleCheckBrand) {
    filter = { soleCheckBrand: req.query.soleCheckBrand.split(",") };
  }

  const productList = await SoleCheckItem.find(filter)
    .populate("soleCheckBrand")
    .populate("soleCheckModel")
    .populate("user");

  if (!productList) {
    res.status(500).json({ success: false });
  }
  res.send(productList);
});

router.get(`/:id`, async (req, res) => {
  try {
    const product = await SoleCheckItem.findById(req.params.id)
      .populate("soleCheckBrand")
      .populate("soleCheckModel")
      .populate("user");

    if (!product) {
      return res
        .status(404)
        .json({ message: "The sole check with the given ID was not found." });
    }

    return res.status(200).send(product);
  } catch (error) {
    // console.error("Error fetching product:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post(
  `/`,
  uploadOptions.fields([
    { name: "appearanceImage", maxCount: 1 },
    { name: "insideLabelImage", maxCount: 1 },
    { name: "insoleImage", maxCount: 1 },
    { name: "insoleStitchImage", maxCount: 1 },
    { name: "boxLabelImage", maxCount: 1 },
    { name: "dateCodeImage", maxCount: 1 },
    { name: "additionalImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const soleCheckBrand = await SoleCheckBrand.findById(
        req.body.soleCheckBrand
      );

      if (!soleCheckBrand)
        return res.status(400).send("Invalid soleCheckBrand");

      const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

      const appearanceImageFile = req.files["appearanceImage"];
      const insideLabelImageFile = req.files["insideLabelImage"];
      const insoleImageFile = req.files["insoleImage"];
      const insoleStitchImageFile = req.files["insoleStitchImage"];
      const boxLabelImageFile = req.files["boxLabelImage"];
      const dateCodeImageFile = req.files["dateCodeImage"];
      const additionalImageFile = req.files["additionalImage"];

      const soleCheckItem = new SoleCheckItem({
        soleCheckBrand: req.body.soleCheckBrand,
        soleCheckModel: req.body.soleCheckModel,
        soleService: req.body.soleService,
        appearanceImage: appearanceImageFile
          ? `${basePath}${appearanceImageFile[0].filename}`
          : "",
        insideLabelImage: insideLabelImageFile
          ? `${basePath}${insideLabelImageFile[0].filename}`
          : "",
        insoleImage: insoleImageFile
          ? `${basePath}${insoleImageFile[0].filename}`
          : "",
        insoleStitchImage: insoleStitchImageFile
          ? `${basePath}${insoleStitchImageFile[0].filename}`
          : "",
        boxLabelImage: boxLabelImageFile
          ? `${basePath}${boxLabelImageFile[0].filename}`
          : "",
        dateCodeImage: dateCodeImageFile
          ? `${basePath}${dateCodeImageFile[0].filename}`
          : "",
        additionalImage: additionalImageFile
          ? `${basePath}${additionalImageFile[0].filename}`
          : "",
        remarks: req.body.remarks,
        user: req.body.user,
        checkedStatus: req.body.checkedStatus,
        dateCreated: req.body.dateCreated,
      });

      const savedCheckItem = await soleCheckItem.save();

      if (!savedCheckItem) {
        return res.status(500).send("The Sole Check Item cannot be created");
      }

      res.send(savedCheckItem);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

router.put(
  "/update/:id",
  uploadOptions.fields([
    { name: "appearanceImage", maxCount: 1 },
    { name: "insideLabelImage", maxCount: 1 },
    { name: "insoleImage", maxCount: 1 },
    { name: "insoleStitchImage", maxCount: 1 },
    { name: "boxLabelImage", maxCount: 1 },
    { name: "dateCodeImage", maxCount: 1 },
    { name: "additionalImage", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const basePath = `https://${req.get("host")}/public/uploads/`;

      const appearanceImageFile = req.files["appearanceImage"];
      const insideLabelImageFile = req.files["insideLabelImage"];
      const insoleImageFile = req.files["insoleImage"];
      const insoleStitchImageFile = req.files["insoleStitchImage"];
      const boxLabelImageFile = req.files["boxLabelImage"];
      const dateCodeImageFile = req.files["dateCodeImage"];
      const additionalImageFile = req.files["additionalImage"];

      const updateFields = {
        appearanceImage: appearanceImageFile
          ? `${basePath}${appearanceImageFile[0].filename}`
          : null,
        insideLabelImage: insideLabelImageFile
          ? `${basePath}${insideLabelImageFile[0].filename}`
          : null,
        insoleImage: insoleImageFile
          ? `${basePath}${insoleImageFile[0].filename}`
          : null,
        insoleStitchImage: insoleStitchImageFile
          ? `${basePath}${insoleStitchImageFile[0].filename}`
          : null,
        boxLabelImage: boxLabelImageFile
          ? `${basePath}${boxLabelImageFile[0].filename}`
          : null,
        dateCodeImage: dateCodeImageFile
          ? `${basePath}${dateCodeImageFile[0].filename}`
          : null,
        additionalImage: additionalImageFile
          ? `${basePath}${additionalImageFile[0].filename}`
          : null,
      };

      const updatedCheckItem = await SoleCheckItem.findByIdAndUpdate(
        req.params.id,
        updateFields,
        { new: true }
      );

      if (!updatedCheckItem) {
        return res.status(404).send("Sole Check Item not found");
      }

      res.send(updatedCheckItem);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send("Invalid checked Id");
    }

    const updatedProduct = await SoleCheckItem.findByIdAndUpdate(
      req.params.id,
      {
        checkedStatus: req.body.checkedStatus,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(500).send("The SoleCheckItem cannot be updated!");
    }

    res.send(updatedProduct);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.delete("/:id", (req, res) => {
  SoleCheckItem.findByIdAndDelete(req.params.id)
    .then((product) => {
      if (product) {
        return res
          .status(200)
          .json({ success: true, message: "the SoleCheckItem is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "SoleCheckItem not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

router.get(`/get/count`, async (req, res) => {
  try {
    const productCount = await SoleCheckItem.countDocuments();

    if (!productCount) {
      return res.status(500).json({ success: false });
    }

    res.send({
      productCount: productCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = router;

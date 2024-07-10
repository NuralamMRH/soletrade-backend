const express = require("express");
const { SellingItem } = require("../models/sellingItem");

const router = express.Router();
const multer = require("multer");

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
    if (!isValid) {
      const uploadError = new Error("Invalid image type");
      return cb(uploadError);
    }
    cb(null, "public/uploads");
  },
  filename: function (req, file, cb) {
    const extension = FILE_TYPE_MAP[file.mimetype];
    const newFileName = `soletrade-${Date.now()}-${uploadCount}.${extension}`;
    uploadCount++;
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
  const sellingList = await SellingItem.find()
    .populate({ path: "sellerId", select: "-passwordHash" })
    .populate({ path: "buyerId", select: "-passwordHash" })
    .populate({ path: "productId", select: "-description -variations -images" })
    .populate({
      path: "bidderOffer",
      select: "-passwordHash",
      populate: {
        path: "shippingLocation",
      },
    })
    .populate({
      path: "selectedAttributeId",
      select: "optionName",
      populate: {
        path: "attributeId",
        select: "name",
      },
    })
    .sort({ sellingAt: -1 });

  if (!sellingList) {
    res.status(500).json({ success: false });
  }
  res.send(sellingList);
});

router.get(`/:id`, async (req, res) => {
  try {
    const sellingItem = await SellingItem.findById(req.params.id)
      .populate({ path: "sellerId", select: "-passwordHash" })
      .populate({ path: "buyerId", select: "-passwordHash" })
      .populate({
        path: "productId",
        select: "-description -variations -images",
      })
      .populate({
        path: "bidderOffer",
        select: "-passwordHash",
        populate: {
          path: "shippingLocation",
        },
      })
      .populate({
        path: "selectedAttributeId",
        select: "optionName",
        populate: {
          path: "attributeId",
          select: "name",
        },
      });

    if (!sellingItem) {
      return res.status(404).json({
        message: "The selling item with the given Id was not found.",
      });
    }

    return res.status(200).send(sellingItem);
  } catch (error) {
    // console.error("Error fetching product:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post(
  "/",
  uploadOptions.fields([{ name: "images" }]),
  async (req, res) => {
    try {
      const basePath = `http://${req.get("host")}/public/uploads/`;

      let imagesPaths = [];

      if (req.files && req.files["images"]) {
        // Check if files and "images" field exist
        const imagesFiles = req.files["images"];
        imagesPaths = imagesFiles.map((file) => `${basePath}${file.filename}`);
      }

      const sellingItem = new SellingItem({
        sellingType: req.body.sellingType,
        sellerId: req.body.sellerId,
        productId: req.body.productId,
        bidderOffer: req.body.bidderOffer,
        selectedAttributeId: req.body.selectedAttributeId,
        sellingPrice: req.body.sellingPrice,
        sellingCommission: req.body.sellingCommission,
        sellerFee: req.body.sellerFee,
        earnings: req.body.earnings,
        cashOutFee: req.body.cashOutFee,
        finalCashOutAmount: req.body.finalCashOutAmount,
        itemCondition: req.body.itemCondition,
        packaging: req.body.packaging,
        status: req.body.status,
        itemVerification: req.body.itemVerification,
        sellingAt: req.body.sellingAt,
        validUntil: req.body.validUntil,
        images: imagesPaths,
      });

      const savedSellingItem = await sellingItem.save();

      if (!savedSellingItem) {
        return res.status(400).send("The selling Item cannot be created!");
      }

      res.send(savedSellingItem);
    } catch (error) {
      console.error("Error during file upload:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

router.put(
  "/:id",
  uploadOptions.fields([{ name: "images" }]),
  async (req, res) => {
    try {
      const basePath = `http://${req.get("host")}/public/uploads/`;

      let imagesPaths = [];

      if (req.files && req.files["images"]) {
        // Check if files and "images" field exist
        const imagesFiles = req.files["images"];
        imagesPaths = imagesFiles.map((file) => `${basePath}${file.filename}`);
      }

      const sellingItem = await SellingItem.findByIdAndUpdate(
        req.params.id,
        {
          sellingType: req.body.sellingType,
          sellingPrice: req.body.sellingPrice,
          sellerFee: req.body.sellerFee,
          earnings: req.body.earnings,
          cashOutFee: req.body.cashOutFee,
          finalCashOutAmount: req.body.finalCashOutAmount,
          status: req.body.status,
          validUntil: req.body.validUntil,
          images: imagesPaths,
          itemVerification: req.body.itemVerification,
          buyerId: req.body.buyerId,
        },
        { new: true }
      );

      if (!sellingItem) {
        return res.status(400).send("The selling Item cannot be updated!");
      }

      res.send(sellingItem);
    } catch (error) {
      console.error("Error during file upload:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

router.delete("/:id", async (req, res) => {
  try {
    const sellingItem = await SellingItem.findOneAndDelete({
      _id: req.params.id,
    });

    if (sellingItem) {
      return res
        .status(200)
        .json({ success: true, message: "The selling Item is deleted!" });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "Bidding Offer not found!" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get(`/get/count`, async (req, res) => {
  try {
    const totalSales = await SellingItem.countDocuments();

    if (!totalSales) {
      return res.status(500).json({ success: false });
    }

    res.send({
      totalSales: totalSales,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.get(`/get/sells/:userid`, async (req, res) => {
  const userSellingItems = await SellingItem.find({
    sellerId: req.params.userid,
  })
    .populate({ path: "sellerId", select: "-passwordHash" })
    .populate({ path: "buyerId", select: "-passwordHash" })
    .populate({ path: "productId", select: "-description -variations -images" })
    .populate({
      path: "bidderOffer",
      select: "-passwordHash",
      populate: {
        path: "shippingLocation",
      },
    })
    .populate({
      path: "selectedAttributeId",
      select: "optionName",
      populate: {
        path: "attributeId",
        select: "name",
      },
    })
    .sort({ validUntil: -1 });

  if (!userSellingItems) {
    res.status(500).json({ success: false });
  }
  res.send(userSellingItems);
});

router.get(`/productoffers/:productId`, async (req, res) => {
  const productId = req.params.productId;

  const offersInProduct = await SellingItem.find({
    productId: productId,
  })
    .populate({ path: "sellerId", select: "-passwordHash" })
    .populate({ path: "buyerId", select: "-passwordHash" })
    .populate({ path: "productId", select: "-description -variations -images" })
    .populate({
      path: "bidderOffer",
      select: "-passwordHash",
      populate: {
        path: "shippingLocation",
      },
    })
    .populate({
      path: "selectedAttributeId",
      select: "optionName",
      populate: {
        path: "attributeId",
        select: "name",
      },
    })
    .sort({ validUntil: -1 });

  if (!offersInProduct) {
    res.status(500).json({ success: false });
  }
  res.send(offersInProduct);
});

router.get(`/offers/:productId/:selectedAttributeId`, async (req, res) => {
  const productId = req.params.productId;
  const selectedAttributeId = req.params.selectedAttributeId;

  const offersInProduct = await SellingItem.find({
    productId: productId,
    selectedAttributeId: selectedAttributeId,
  })
    .populate({ path: "sellerId", select: "-passwordHash" })
    .populate({ path: "buyerId", select: "-passwordHash" })
    .populate({ path: "productId", select: "-description -variations -images" })
    .populate({
      path: "bidderOffer",
      select: "-passwordHash",
      populate: {
        path: "shippingLocation",
      },
    })
    .populate({
      path: "selectedAttributeId",
      select: "optionName",
      populate: {
        path: "attributeId",
        select: "name",
      },
    })
    .sort({ validUntil: -1 });

  if (!offersInProduct) {
    res.status(500).json({ success: false });
  }
  res.send(offersInProduct);
});

module.exports = router;

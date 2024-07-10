const { Product } = require("../models/product");
const express = require("express");
const { Category } = require("../models/category");
const router = express.Router();
const mongoose = require("mongoose");
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
  if (req.query.categories) {
    filter = { category: req.query.categories.split(",") };
  }

  const productList = await Product.find(filter)
    .populate("category")
    .populate("brand")

    .populate({
      path: "variations.attributeOptionId",
      populate: {
        path: "attributeId",
      },
    });

  if (!productList) {
    res.status(500).json({ success: false });
  }
  res.send(productList);
});

router.get(`/:id`, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("category")
      .populate("brand")
      .populate({
        path: "variations.attributeOptionId",
        populate: {
          path: "attributeId",
        },
      });

    if (!product) {
      return res
        .status(404)
        .json({ message: "The product with the given ID was not found." });
    }

    return res.status(200).send(product);
  } catch (error) {
    // console.error("Error fetching product:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post(
  `/`,
  uploadOptions.fields([{ name: "image", maxCount: 1 }, { name: "images" }]),
  async (req, res) => {
    try {
      const category = await Category.findById(req.body.category);
      if (!category) return res.status(400).send("Invalid Category");

      const imageFile = req.files["image"];
      const fileName = imageFile ? imageFile[0].filename : null;
      const basePath = `https://${req.get("host")}/public/uploads/`;

      let imagesPaths = [];

      if (req.files && req.files["images"]) {
        const imagesFiles = req.files["images"];
        imagesPaths = imagesFiles.map((file) => `${basePath}${file.filename}`);
      }

      // Parse variations JSON
      const variations = req.body.variations
        ? JSON.parse(req.body.variations)
        : [];

      // Map variations to include the attributeOptionId
      const variationsWithAttribute = variations.map((variation) => ({
        attributeOptionId: variation.attributeOptionId,
      }));

      const product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${basePath}${fileName}`,
        images: imagesPaths,
        brand: req.body.brand,
        model: req.body.model,
        category: req.body.category,
        attributeId: req.body.attributeId,
        variations: variationsWithAttribute, // Use the modified variations array
        sku: req.body.sku,
        colorway: req.body.colorway,
        mainColor: req.body.mainColor,
        retailPrice: req.body.retailPrice,
        rating: req.body.rating,
        numViews: req.body.numViews,
        isFeatured: req.body.isFeatured,
        publishDate: req.body.publishDate,
        dateCreated: req.body.dateCreated,
      });

      const savedProduct = await product.save();

      if (!savedProduct) {
        return res.status(500).send("The product cannot be created");
      }

      res.send(savedProduct);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

router.put(
  "/:id",
  uploadOptions.fields([
    { name: "image", maxCount: 1 },
    { name: "images", maxCount: 100 },
  ]),
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send("Invalid Product Id");
      }

      const category = await Category.findById(req.body.category);
      if (!category) {
        return res.status(400).send("Invalid Category");
      }

      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(400).send("Invalid Product!");
      }

      const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
      let imagepath = product.image;

      // Handle single file upload
      const imageFile = req.files && req.files["image"];
      if (imageFile) {
        const fileName = imageFile[0].filename;
        imagepath = `${basePath}${fileName}`;
      }

      // Handle multiple file upload
      const imagesFiles = req.files && req.files["images"];
      let imagesPaths = product.images;
      if (imagesFiles) {
        imagesPaths = imagesFiles.map((file) => `${basePath}${file.filename}`);
      }

      const updatedProduct = await Product.findByIdAndUpdate(
        req.params.id,
        {
          name: req.body.name,
          description: req.body.description,
          richDescription: req.body.richDescription,
          image: imagepath,
          images: imagesPaths,
          brand: req.body.brand,
          model: req.body.model,
          sku: req.body.sku,
          colorway: req.body.colorway,
          mainColor: req.body.mainColor,
          retailPrice: req.body.retailPrice,
          category: req.body.category,
          itemCondition: req.body.itemCondition,
          rating: req.body.rating,
          numViews: req.body.numViews,
          publishDate: req.body.publishDate,
          isFeatured: req.body.isFeatured,
        },
        { new: true }
      );

      if (!updatedProduct) {
        return res.status(500).send("The product cannot be updated!");
      }

      res.send(updatedProduct);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

router.get("/viewed/:id", async (req, res) => {
  try {
    const viewed = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $inc: { numViews: 1 }, // Increment numViews by 1
      },
      { new: true }
    );

    if (!viewed) {
      return res.status(500).send("The product cannot be updated!");
    }

    res.send(viewed);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.delete("/:id", (req, res) => {
  Product.findByIdAndDelete(req.params.id)
    .then((product) => {
      if (product) {
        return res
          .status(200)
          .json({ success: true, message: "the product is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "product not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

router.get(`/get/count`, async (req, res) => {
  try {
    const productCount = await Product.countDocuments();

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

router.get(`/get/featured/:count`, async (req, res) => {
  const count = req.params.count ? req.params.count : 0;
  const products = await Product.find({ isFeatured: true }).limit(+count);

  if (!products) {
    res.status(500).json({ success: false });
  }
  res.send(products);
});

router.put(
  "/gallery-images/:id",
  uploadOptions.array("images", 10),
  async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).send("Invalid Product Id");
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(400).send("Invalid Product!");

    const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;

    // Handle multiple file upload
    const imagesFiles = req.files && req.files["images"];
    let imagesPaths = product.images;
    if (imagesFiles) {
      imagesPaths = imagesFiles.map((file) => `${basePath}${file.filename}`);
    }

    const productGal = await Product.findByIdAndUpdate(
      req.params.id,
      {
        images: imagesPaths,
      },
      { new: true }
    );

    if (!productGal)
      return res.status(500).send("the gallery cannot be updated!");

    res.send(productGal);
  }
);

router.get("/size/:attributeOptionId", async (req, res) => {
  try {
    const attributeOptionId = req.params.attributeOptionId;

    const pdItems = await Product.find({
      variations: {
        $elemMatch: {
          attributeOptionId: attributeOptionId,
        },
      },
    });

    if (!pdItems || pdItems.length === 0) {
      return res.status(404).json({
        message: "No products found for the given attributeOptionId",
      });
    }

    res.json(pdItems);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;

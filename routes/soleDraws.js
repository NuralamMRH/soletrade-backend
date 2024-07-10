const express = require("express");

const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const { SoleDraw } = require("../models/soleDraw");

const FILE_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpeg",
  "image/jpg": "jpg",
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
    const newFileName = `soletrade-${Date.now()}-${uploadCount}.${extension}`;
    uploadCount++; // Increment the upload count for the next file
    cb(null, newFileName);
  },
});

const uploadOptions = multer({ storage: storage });

router.get(`/`, async (req, res) => {
  // localhost:3000/api/v1/products?categories=2342342,234234

  const blogList = await SoleDraw.find();

  if (!blogList) {
    res.status(500).json({ success: false });
  }
  res.send(blogList);
});

router.get(`/:id`, async (req, res) => {
  try {
    const blogPost = await SoleDraw.findById(req.params.id);

    if (!blogPost) {
      return res
        .status(404)
        .json({ message: "The sole draw with the given ID was not found." });
    }

    return res.status(200).send(blogPost);
  } catch (error) {
    // console.error("Error fetching product:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post(
  `/`,
  uploadOptions.fields([{ name: "image", maxCount: 1 }]),
  async (req, res) => {
    try {
      const imageFile = req.files["image"];
      const fileName = imageFile ? imageFile[0].filename : null;
      const basePath = `https://${req.get("host")}/public/uploads/`;

      const blogPost = new SoleDraw({
        name: req.body.name,
        richDescription: req.body.richDescription,
        image: `${basePath}${fileName}`,
        publishDate: req.body.publishDate,
        dateCreated: req.body.dateCreated,
      });

      const savedBlogPost = await blogPost.save();

      if (!savedBlogPost) {
        return res.status(500).send("The sole draw post cannot be created");
      }

      res.send(blogPost);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

router.put(
  "/:id",
  uploadOptions.fields([{ name: "image", maxCount: 1 }]),
  async (req, res) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send("Invalid Sole Draw Id");
      }

      const blogPost = await SoleDraw.findById(req.params.id);
      if (!blogPost) {
        return res.status(400).send("Invalid SoleDraw!");
      }

      const basePath = `https://${req.get("host")}/public/uploads/`;
      let imagepath = blogPost.image;

      // Handle single file upload
      const imageFile = req.files && req.files["image"];
      if (imageFile) {
        const fileName = imageFile[0].filename;
        imagepath = `${basePath}${fileName}`;
      }

      const updatedBlogPost = await SoleDraw.findByIdAndUpdate(
        req.params.id,
        {
          name: req.body.name,
          richDescription: req.body.richDescription,
          image: imagepath,
          publishDate: req.body.publishDate,
        },
        { new: true }
      );

      if (!updatedBlogPost) {
        return res.status(500).send("The Sole Draw  cannot be updated!");
      }

      res.send(updatedBlogPost);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);

router.delete("/:id", (req, res) => {
  SoleDraw.findByIdAndDelete(req.params.id)
    .then((blog) => {
      if (blog) {
        return res
          .status(200)
          .json({ success: true, message: "the Sole Draw is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Sole Draw not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

router.get(`/get/count`, async (req, res) => {
  try {
    const blogCount = await SoleDraw.countDocuments();

    if (!blogCount) {
      return res.status(500).json({ success: false });
    }

    res.send({
      blogCount: blogCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = router;

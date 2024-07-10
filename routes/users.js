const { User } = require("../models/user");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
  const userList = await User.find().select("-passwordHash");

  if (!userList) {
    res.status(500).json({ success: false });
  }
  res.send(userList);
});

router.get("/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-passwordHash");

    if (!user) {
      return res
        .status(404)
        .json({ message: "The user with the given ID was not found." });
    }

    return res.status(200).send(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/get/:identifier", async (req, res) => {
  try {
    const identifier = req.params.identifier;

    let user;

    if (identifier.includes("@")) {
      // If the identifier contains '@', assume it's an email
      user = await User.findOne({ email: identifier }).select("-passwordHash");
    } else if (!isNaN(identifier)) {
      // If the identifier is a number, assume it's a phone number
      user = await User.findOne({ phone: identifier }).select("-passwordHash");
    } else {
      // Otherwise, assume it's an id
      user = await User.findById(identifier).select("-passwordHash");
    }

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).send(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    // Check if the email or phone already exists in the database
    const existingUser = await User.findOne({
      $or: [{ email: req.body.email }, { phone: req.body.phone }],
    });

    if (existingUser) {
      return res
        .status(400)
        .send("User with this email or phone number already exists!");
    }

    // If the user does not exist, create a new user
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
      phone: req.body.phone,
      isAdmin: req.body.isAdmin,
      billingAddress1: req.body.billingAddress1,
      billingAddress2: req.body.billingAddress2,
      apartment: req.body.apartment,
      zip: req.body.zip,
      city: req.body.city,
      country: req.body.country,
    });

    const savedUser = await user.save();

    if (!savedUser) {
      return res.status(400).send("The user cannot be created!");
    }

    res.send(savedUser);
  } catch (error) {
    console.error("Error during user registration:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, phone, password, expoPushToken } = req.body;

    // Find user by email or phone
    const user = await User.findOne({ $or: [{ email }, { phone }] });

    if (!user) {
      return res.status(400).send("User not found");
    }

    if (user && bcrypt.compareSync(password, user.passwordHash)) {
      const token = jwt.sign(
        {
          userId: user.id,
          isAdmin: user.isAdmin,
        },
        process.env.secret,
        { expiresIn: "1m" }
      );

      // Update the Expo push token for the user
      user.expoPushToken = expoPushToken;
      await user.save();

      res.status(200).send({
        user: user.email,
        token: token,
        expoPushToken: user.expoPushToken,
      });
    } else {
      res.status(400).send("Password is wrong!");
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.post("/register", async (req, res) => {
  try {
    // Check if the email is valid
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      return res.status(400).send("Invalid email address!");
    }

    // Check if the phone number is valid
    const phoneRegex = /^[0-9]{11}$/; // Assuming a 10-digit phone number
    if (!phoneRegex.test(req.body.phone)) {
      return res.status(400).send("Need valid 11 digit phone number!");
    }

    // Check if the email or phone already exists in the database
    const existingUser = await User.findOne({
      $or: [{ email: req.body.email }, { phone: req.body.phone }],
    });

    if (existingUser) {
      return res
        .status(400)
        .send("User with this email or phone number already exists!");
    }

    // If the user does not exist and the email and phone are valid, create a new user
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      passwordHash: bcrypt.hashSync(req.body.password, 10),
      phone: req.body.phone,
      isAdmin: req.body.isAdmin,
      billingAddress1: req.body.billingAddress1,
      billingAddress2: req.body.billingAddress2,
      apartment: req.body.apartment,
      zip: req.body.zip,
      city: req.body.city,
      country: req.body.country,
      image: req.body.image,
    });

    const savedUser = await user.save();

    if (!savedUser) {
      return res.status(400).send("The user cannot be created!");
    }

    res.send(savedUser);
  } catch (error) {
    console.error("Error during user registration:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.put("/update/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if the new email or phone already exists in the database
    const existingUser = await User.findOne({
      $or: [{ email: req.body.email }, { phone: req.body.phone }],
      _id: { $ne: userId }, // Exclude the current user from the check
    });

    if (existingUser) {
      return res.status(400).send("Email or phone number already exists!");
    }

    // If the new email or phone is unique, update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
          isAdmin: req.body.isAdmin,
          billingAddress1: req.body.billingAddress1,
          billingAddress2: req.body.billingAddress2,
          apartment: req.body.apartment,
          zip: req.body.zip,
          city: req.body.city,
          country: req.body.country,
          defaultShipping: req.body.defaultShipping,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).send("User not found or cannot be updated!");
    }

    res.send(updatedUser);
  } catch (error) {
    console.error("Error during user update:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.put("/update-pass/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if the current password matches the user's password
    const user = await User.findById(userId);
    if (
      !user ||
      !bcrypt.compareSync(req.body.currentPassword, user.passwordHash)
    ) {
      return res.status(401).send("Current password is incorrect");
    }

    // Check if the new password is equal to the confirm password
    if (req.body.newPassword !== req.body.confirmPassword) {
      return res
        .status(400)
        .send("New password and confirm password do not match");
    }

    // Check if the new password meets complexity requirements
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(req.body.newPassword)) {
      return res
        .status(400)
        .send("New password does not meet complexity requirements");
    }

    // If everything is okay, update the user's password
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          passwordHash: bcrypt.hashSync(req.body.newPassword, 10),
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).send("User not found or cannot be updated!");
    }

    res.send(updatedUser);
  } catch (error) {
    console.error("Error during user update:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.put(
  "/profile-photo/:id",
  uploadOptions.single("image"),
  async (req, res) => {
    try {
      const userId = req.params.id;

      const file = req.file;
      let imagepath;

      if (file) {
        const fileName = file.filename;
        const basePath = `${req.protocol}://${req.get("host")}/public/uploads/`;
        imagepath = `${basePath}${fileName}`;
      } else {
        return res.status(400).send("No image file provided");
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: { image: imagepath } },
        { new: true }
      );

      if (!updatedUser) {
        return res.status(400).send("User not found or cannot be updated!");
      }

      res.send(updatedUser);
    } catch (error) {
      console.error("Error during user image update:", error);
      res.status(500).send("Internal Server Error");
    }
  }
);

router.delete("/:id", (req, res) => {
  console.log("Deleting user with ID:", req.params.id);

  User.findByIdAndDelete(req.params.id)
    .then((user) => {
      console.log("Deleted user:", user);

      if (user) {
        return res
          .status(200)
          .json({ success: true, message: "The user is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "User not found!" });
      }
    })
    .catch((err) => {
      console.error("Error deleting user:", err);
      return res.status(500).json({ success: false, error: err });
    });
});

router.get(`/get/count`, async (req, res) => {
  try {
    const userCount = await User.countDocuments();

    if (!userCount) {
      return res.status(500).json({ success: false });
    }

    res.send({
      userCount: userCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = router;

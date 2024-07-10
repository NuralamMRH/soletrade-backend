const express = require("express");
const { Shipping } = require("../models/shipping");
const router = express.Router();

router.get(`/`, async (req, res) => {
  const shippingList = await Shipping.find();

  if (!shippingList) {
    res.status(500).json({ success: false });
  }
  res.send(shippingList);
});

router.get("/:id", async (req, res) => {
  try {
    const shipping = await Shipping.findById(req.params.id);

    if (!shipping) {
      return res
        .status(404)
        .json({ message: "The shipping with the given ID was not found." });
    }

    return res.status(200).send(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.get("/:identifier", async (req, res) => {
  try {
    const identifier = req.params.identifier;

    let user;

    if (identifier.includes("@")) {
      // If the identifier contains '@', assume it's an email
      user = await Shipping.findOne({ email: identifier });
    } else if (!isNaN(identifier)) {
      // If the identifier is a number, assume it's a phone number
      user = await Shipping.findOne({ phone: identifier });
    } else {
      // Otherwise, assume it's an id
      user = await Shipping.findById(identifier);
    }

    if (!user) {
      return res.status(404).json({ message: "User Shipping not found." });
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
    const existingUserShipping = await Shipping.findOne({
      $or: [{ email: req.body.email }, { phone: req.body.phone }],
    });

    if (existingUserShipping) {
      return res
        .status(400)
        .send("User ship with this email or phone number already exists!");
    }

    // If the user does not exist, create a new user
    const userShipping = new Shipping({
      shippingName: req.body.shippingName,
      shippingAddressLine1: req.body.shippingAddressLine1,
      shippingAddressLine2: req.body.shippingAddressLine2,
      apartment: req.body.apartment,
      email: req.body.email,
      phone: req.body.phone,
      zip: req.body.zip,
      city: req.body.city,
      country: req.body.country,
      user: req.body.user,
    });

    const savedUserShip = await userShipping.save();

    if (!savedUserShip) {
      return res.status(400).send("The user cannot be created!");
    }

    res.send(savedUserShip);
  } catch (error) {
    console.error("Error during user registration:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.delete("/:id", (req, res) => {
  console.log("Deleting User Ship with ID:", req.params.id);

  Shipping.findByIdAndDelete(req.params.id)
    .then((ship) => {
      console.log("Deleted user:", ship);

      if (ship) {
        return res
          .status(200)
          .json({ success: true, message: "The user is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "User ship not found!" });
      }
    })
    .catch((err) => {
      console.error("Error deleting user:", err);
      return res.status(500).json({ success: false, error: err });
    });
});

router.get(`/usership/:user`, async (req, res) => {
  const userShips = await Shipping.find({ user: req.params.user }).sort({
    validUntil: -1,
  });

  if (!userShips) {
    res.status(500).json({ success: false });
  }
  res.send(userShips);
});

module.exports = router;

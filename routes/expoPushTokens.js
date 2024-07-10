const express = require("express");
const { ExpoPush } = require("../models/expoPush");
const router = express.Router();

router.get(`/`, async (req, res) => {
  const expoPushList = await ExpoPush.find();

  if (!expoPushList) {
    res.status(500).json({ success: false });
  }
  res.status(200).send(expoPushList);
});

router.get("/:id", async (req, res) => {
  try {
    const expoPush = await ExpoPush.findById(req.params.id);

    if (!expoPush) {
      return res
        .status(404)
        .json({ message: "The expoPush with the given ID was not found." });
    }

    return res.status(200).send(expoPush);
  } catch (error) {
    // console.error("Error fetching product:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  let expoPush = new ExpoPush({
    expoPushToken: req.body.expoPushToken,
  });
  expoPush = await expoPush.save();

  if (!expoPush) return res.status(400).send("the expoPush cannot be created!");

  res.send(expoPush);
});

router.put("/:id", async (req, res) => {
  const expoPush = await ExpoPush.findByIdAndUpdate(
    req.params.id,
    {
      expoPushToken: req.body.expoPushToken,
    },
    { new: true }
  );

  if (!expoPush) return res.status(400).send("the expoPush cannot be created!");

  res.send(expoPush);
});

router.delete("/:id", async (req, res) => {
  try {
    const expoPush = await ExpoPush.findOneAndDelete({ _id: req.params.id });

    if (expoPush) {
      return res
        .status(200)
        .json({ success: true, message: "The expoPushToken is deleted!" });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "ExpoPushToken not found!" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

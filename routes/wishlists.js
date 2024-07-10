const express = require("express");
const { Wishlist } = require("../models/wishlist");

const router = express.Router();

router.get(`/`, async (req, res) => {
  const portfolioItemList = await Wishlist.find()
    .populate({ path: "user", select: "-passwordHash" })
    .populate({ path: "product", select: "-description -variations -images" })
    .sort({ dateCreated: -1 });

  if (!portfolioItemList) {
    res.status(500).json({ success: false });
  }
  res.send(portfolioItemList);
});

router.get(`/:id`, async (req, res) => {
  try {
    const portfolioItem = await Wishlist.findById(req.params.id)
      .populate({ path: "user", select: "-passwordHash" })
      .populate({
        path: "product",
        select: "-description -variations -images",
      });

    if (!portfolioItem) {
      return res.status(404).json({
        message: "The  item with the given Id was not found.",
      });
    }

    return res.status(200).send(portfolioItem);
  } catch (error) {
    // console.error("Error fetching product:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  try {
    const portfolioItem = new Wishlist({
      user: req.body.user,
      product: req.body.product,
      dateCreated: req.body.dateCreated,
    });

    const savedPortfolioItem = await portfolioItem.save();

    if (!savedPortfolioItem) {
      return res.status(400).send("The  Item cannot be created!");
    }

    res.send(savedPortfolioItem);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const portfolioItem = await Wishlist.findOneAndDelete({
      _id: req.params.id,
    });

    if (portfolioItem) {
      return res
        .status(200)
        .json({ success: true, message: "The wishlist Item is deleted!" });
    } else {
      return res.status(404).json({ success: false, message: "Not found!" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get(`/get/count`, async (req, res) => {
  try {
    const totalPortfolio = await Wishlist.countDocuments();

    if (!totalPortfolio) {
      return res.status(500).json({ success: false });
    }

    res.send({
      totalPortfolio: totalPortfolio,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.get(`/user/:user`, async (req, res) => {
  const userPortfolioItems = await Wishlist.find({
    user: req.params.user,
  })
    .populate({ path: "user", select: "-passwordHash" })
    .populate({
      path: "product",
      populate: "brand",
      populate: "category",
      populate: {
        path: "variations.attributeOptionId",
        populate: "attributeId",
      },
    })
    .sort({ dateCreated: -1 });

  if (!userPortfolioItems) {
    res.status(500).json({ success: false });
  }
  res.send(userPortfolioItems);
});

router.get(`/product/:product`, async (req, res) => {
  const portfolioItem = await Wishlist.find({
    product: req.params.product,
  })
    .populate({ path: "user", select: "-passwordHash" })
    .populate({ path: "product", select: "-description -variations -images" });
  if (!portfolioItem) {
    res.status(500).json({ success: false });
  }
  res.send(portfolioItem);
});

module.exports = router;

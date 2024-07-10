const express = require("express");
const { PortfolioItem } = require("../models/portfolioItem");
const router = express.Router();

router.get(`/`, async (req, res) => {
  const portfolioItemList = await PortfolioItem.find()
    .populate({ path: "user", select: "-passwordHash" })
    .populate({ path: "product", select: "-description -variations -images" })
    .populate({
      path: "size",
      select: "optionName",
      populate: {
        path: "attributeId",
        select: "name",
      },
    })
    .sort({ createdAt: -1 });

  if (!portfolioItemList) {
    res.status(500).json({ success: false });
  }
  res.send(portfolioItemList);
});

router.get(`/:id`, async (req, res) => {
  try {
    const portfolioItem = await PortfolioItem.findById(req.params.id)
      .populate({ path: "user", select: "-passwordHash" })
      .populate({
        path: "product",
        select: "-description -variations -images",
      })
      .populate({
        path: "size",
        select: "optionName",
        populate: {
          path: "attributeId",
          select: "name",
        },
      });

    if (!portfolioItem) {
      return res.status(404).json({
        message: "The portfolio item item with the given Id was not found.",
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
    const portfolioItem = new PortfolioItem({
      user: req.body.user,
      product: req.body.product,
      size: req.body.size,
      itemCondition: req.body.itemCondition,
      purchasePrice: req.body.purchasePrice,
      purchaseAt: req.body.purchaseAt,
      createdAt: req.body.createdAt,
    });

    const savedPortfolioItem = await portfolioItem.save();

    if (!savedPortfolioItem) {
      return res.status(400).send("The Portfolio Item cannot be created!");
    }

    res.send(savedPortfolioItem);
  } catch (error) {
    console.error("Error during file upload:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.put("/:id", async (req, res) => {
  try {
    const portfolioItem = await PortfolioItem.findByIdAndUpdate(
      req.params.id,
      {
        product: req.body.product,
        size: req.body.size,
        itemCondition: req.body.itemCondition,
        purchasePrice: req.body.purchasePrice,
        purchaseAt: req.body.purchaseAt,
      },
      { new: true }
    );

    if (!portfolioItem) {
      return res.status(400).send("The portfolio Item cannot be updated!");
    }

    res.send(portfolioItem);
  } catch (error) {
    console.error("Error during file upload:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const portfolioItem = await PortfolioItem.findOneAndDelete({
      _id: req.params.id,
    });

    if (portfolioItem) {
      return res
        .status(200)
        .json({ success: true, message: "The portfolio Item is deleted!" });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "portfolio not found!" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get(`/get/count`, async (req, res) => {
  try {
    const totalPortfolio = await PortfolioItem.countDocuments();

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
  const userPortfolioItems = await PortfolioItem.find({
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
    .populate({
      path: "size",
      select: "optionName",
      populate: {
        path: "attributeId",
        select: "name",
      },
    })
    .sort({ createdAt: -1 });

  if (!userPortfolioItems) {
    res.status(500).json({ success: false });
  }
  res.send(userPortfolioItems);
});

router.get(`/product/:product`, async (req, res) => {
  const portfolioItem = await SellingItem.find({
    product: req.params.product,
  })
    .populate({ path: "user", select: "-passwordHash" })
    .populate({ path: "product", select: "-description -variations -images" })
    .populate({
      path: "size",
      select: "optionName",
      populate: {
        path: "attributeId",
        select: "name",
      },
    })
    .sort({ createdAt: -1 });

  if (!portfolioItem) {
    res.status(500).json({ success: false });
  }
  res.send(portfolioItem);
});

router.get(`/product-size/:product/:size`, async (req, res) => {
  const product = req.params.product;
  const size = req.params.size;

  const portfolioItems = await SellingItem.find({
    product: product,
    size: size,
  })
    .populate({ path: "user", select: "-passwordHash" })
    .populate({ path: "product", select: "-description -variations -images" })
    .populate({
      path: "size",
      select: "optionName",
      populate: {
        path: "attributeId",
        select: "name",
      },
    })
    .sort({ createdAt: -1 });

  if (!portfolioItems) {
    res.status(500).json({ success: false });
  }
  res.send(portfolioItems);
});

module.exports = router;

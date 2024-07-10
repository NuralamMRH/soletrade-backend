const express = require("express");
const { BiddingOffer } = require("../models/biddingOffer");

const router = express.Router();

router.get(`/`, async (req, res) => {
  const biddingList = await BiddingOffer.find()
    .populate({
      path: "productId",
      select: "name richDescription image",
    })

    .populate({
      path: "sellerOffer",
      select: "-bidderOffer -productId",
    })
    .populate({
      path: "user",
      select: "-passwordHash",
    })
    .populate("shippingLocation")
    .populate({
      path: "selectedAttributeId",
      select: "optionName",
      populate: {
        path: "attributeId",
        select: "name",
      },
    })
    .sort({ validUntil: -1 });

  if (!biddingList) {
    res.status(500).json({ success: false });
  }
  res.send(biddingList);
});

router.get(`/:id`, async (req, res) => {
  try {
    const biddingOffer = await BiddingOffer.findById(req.params.id)
      .populate({
        path: "productId",
        select: "name richDescription image",
      })

      .populate({
        path: "sellerOffer",
        select: "-bidderOffer -productId",
      })
      .populate({
        path: "user",
        select: "-passwordHash",
      })
      .populate("shippingLocation")
      .populate({
        path: "selectedAttributeId",
        select: "optionName",
        populate: {
          path: "attributeId",
          select: "name",
        },
      });

    if (!biddingOffer) {
      return res.status(404).json({
        message: "The bidding Offer with the given Id was not found.",
      });
    }

    return res.status(200).send(biddingOffer);
  } catch (error) {
    // console.error("Error fetching product:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  let biddingOffer = new BiddingOffer({
    biddingType: req.body.biddingType,
    biddingStatus: req.body.biddingStatus,
    user: req.body.user,
    productId: req.body.productId,
    sellerOffer: req.body.sellerOffer,
    itemCondition: req.body.itemCondition,
    packaging: req.body.packaging,
    selectedAttributeId: req.body.selectedAttributeId,
    offeredPrice: req.body.offeredPrice,
    totalPrice: req.body.totalPrice,
    offerCreateDate: req.body.offerCreateDate,
    validUntil: req.body.validUntil,
    paymentMethod: req.body.paymentMethod,
    paymentStatus: req.body.paymentStatus,
    paymentDate: req.body.paymentDate,
    shippingStatus: req.body.shippingStatus,
    shippingLocation: req.body.shippingLocation,
  });
  biddingOffer = await biddingOffer.save();

  if (!biddingOffer)
    return res.status(400).send("The Bidding Offer cannot be created!");

  res.send(biddingOffer);
});

router.put("/:id", async (req, res) => {
  const biddingOffer = await BiddingOffer.findByIdAndUpdate(
    req.params.id,
    {
      biddingType: req.body.biddingType,
      biddingStatus: req.body.biddingStatus,
      offeredPrice: req.body.offeredPrice,
      totalPrice: req.body.totalPrice,
      paymentStatus: req.body.paymentStatus,
      validUntil: req.body.validUntil,
      shippingStatus: req.body.shippingStatus,
    },
    { new: true }
  );

  if (!biddingOffer)
    return res.status(400).send("The Bidding Offer cannot be update!");

  res.send(biddingOffer);
});

router.delete("/:id", async (req, res) => {
  try {
    const biddingOffer = await BiddingOffer.findOneAndDelete({
      _id: req.params.id,
    });

    if (biddingOffer) {
      return res
        .status(200)
        .json({ success: true, message: "The bidding offer is deleted!" });
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
    const totalBids = await BiddingOffer.countDocuments();

    if (!totalBids) {
      return res.status(500).json({ success: false });
    }

    res.send({
      totalBids: totalBids,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.get(`/get/useroffer/:userid`, async (req, res) => {
  const userOfferList = await BiddingOffer.find({ user: req.params.userid })
    .populate({
      path: "productId",
      select: "name richDescription image",
    })

    .populate({
      path: "sellerOffer",
      select: "-bidderOffer -productId",
    })
    .populate({
      path: "user",
      select: "-passwordHash",
    })
    .populate("shippingLocation")
    .populate({
      path: "selectedAttributeId",
      select: "optionName",
      populate: {
        path: "attributeId",
        select: "name",
      },
    })
    .sort({ validUntil: -1 });

  if (!userOfferList) {
    res.status(500).json({ success: false });
  }
  res.send(userOfferList);
});

router.get(`/get/product/:productId`, async (req, res) => {
  const productOfferList = await BiddingOffer.find({
    productId: req.params.productId,
  })

    .populate({
      path: "sellerOffer",
      select: "-bidderOffer -productId",
    })
    .populate({
      path: "user",
      select: "-passwordHash",
    })
    .populate("shippingLocation")
    .populate({
      path: "selectedAttributeId",
      select: "optionName",
      populate: {
        path: "attributeId",
        select: "name",
      },
    })
    .sort({ validUntil: -1 });

  if (!productOfferList) {
    res.status(500).json({ success: false });
  }
  res.send(productOfferList);
});

router.get(`/get/product/:productId/:selectedAttributeId`, async (req, res) => {
  const productId = req.params.productId;
  const selectedAttributeId = req.params.selectedAttributeId;

  const productOfferList = await BiddingOffer.find({
    productId: productId,
    selectedAttributeId: selectedAttributeId,
  })
    .populate("user", "name")
    .populate("productId", "name")
    .populate({
      path: "selectedAttributeId",
      select: "optionName",
      populate: {
        path: "attributeId",
        select: "name",
      },
    })
    .sort({ validUntil: -1 });

  if (!productOfferList) {
    res.status(500).json({ success: false });
  }
  res.send(productOfferList);
});

router.get(`/get/attributeOption/:selectedAttributeId`, async (req, res) => {
  const productOfferList = await BiddingOffer.find({
    selectedAttributeId: req.params.selectedAttributeId,
  })
    .populate("user", "name")
    .populate("productId", "name")
    .populate({
      path: "selectedAttributeId",
      select: "optionName",
      populate: {
        path: "attributeId",
        select: "name",
      },
    })
    .sort({ validUntil: -1 });

  if (!productOfferList) {
    res.status(500).json({ success: false });
  }
  res.send(productOfferList);
});

module.exports = router;

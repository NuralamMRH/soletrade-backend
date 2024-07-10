const { Order } = require("../models/order");
const express = require("express");
const { OrderItem } = require("../models/order-item");
const { BiddingOffer } = require("../models/biddingOffer");
const router = express.Router();

router.get(`/`, async (req, res) => {
  const orderList = await Order.find()
    .populate({
      path: "mainProduct",
      select: "name richDescription image",
    })
    .populate("sellerOffer", "sellingPrice")
    .populate({
      path: "sellerOffer",
      select: "-bidderOffer -productId",
      populate: "selectedAttributeId",
    })
    .populate({
      path: "user",
      select: "-passwordHash",
    })
    .sort({ orderCreateAt: -1 });

  if (!orderList) {
    res.status(500).json({ success: false });
  }
  res.send(orderList);
});

router.get(`/:id`, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({
        path: "mainProduct",
        select: "name richDescription image",
      })
      .populate("sellerOffer", "sellingPrice")
      .populate({
        path: "sellerOffer",
        select: "-bidderOffer -productId",
        populate: "selectedAttributeId",
      })
      .populate({
        path: "user",
        select: "-passwordHash",
      });

    if (!order) {
      return res
        .status(404)
        .json({ message: "The order with the given OderId was not found." });
    }

    return res.status(200).send(order);
  } catch (error) {
    // console.error("Error fetching product:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

router.post("/", async (req, res) => {
  let order = new Order({
    orderType: req.body.orderType,
    orderStatus: req.body.orderStatus,
    validUntil: req.body.validUntil,
    totalPrice: req.body.totalPrice,
    offerPrice: req.body.offerPrice,
    sellerOffer: req.body.sellerOffer,
    mainProduct: req.body.mainProduct,
    size: req.body.size,
    billingAddress1: req.body.billingAddress1,
    billingAddress2: req.body.billingAddress2,
    city: req.body.city,
    zip: req.body.zip,
    country: req.body.country,
    phone: req.body.phone,
    itemCondition: req.body.itemCondition,
    packaging: req.body.packaging,
    paymentMethod: req.body.paymentMethod,
    paymentStatus: req.body.paymentStatus,
    paymentDate: req.body.paymentDate,
    orderCreateAt: req.body.orderCreateAt,
    user: req.body.user,
    shippingStatus: req.body.shippingStatus,
  });
  order = await order.save();

  if (!order) return res.status(400).send("the order cannot be created!");

  res.send(order);
});

router.put("/:id", async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      orderType: req.body.orderType,
      orderStatus: req.body.orderStatus,
      validUntil: req.body.validUntil,
      paymentStatus: req.body.paymentStatus,
      paymentMethod: req.body.paymentMethod,
      phone: req.body.phone,
      shippingStatus: req.body.shippingStatus,
    },
    { new: true }
  );

  if (!order) return res.status(400).send("the order cannot be update!");

  res.send(order);
});

router.delete("/:id", async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ _id: req.params.id });

    if (order) {
      return res
        .status(200)
        .json({ success: true, message: "The order is deleted!" });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "order not found!" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get("/get/totalsales", async (req, res) => {
  const totalSales = await Order.aggregate([
    { $group: { _id: null, totalsales: { $sum: "$totalPrice" } } },
  ]);

  if (!totalSales) {
    return res.status(400).send("The order sales cannot be generated");
  }

  res.send({ totalsales: totalSales.pop().totalsales });
});

router.get(`/get/count`, async (req, res) => {
  try {
    const orderCount = await Order.countDocuments();

    if (!orderCount) {
      return res.status(500).json({ success: false });
    }

    res.send({
      orderCount: orderCount,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

router.get(`/get/userorders/:userid`, async (req, res) => {
  const userOrderList = await Order.find({ user: req.params.userid })
    .populate({
      path: "mainProduct",
      select: "name richDescription image",
    })
    .populate("sellerOffer", "sellingPrice")
    .populate({
      path: "sellerOffer",
      select: "-bidderOffer -productId",
      populate: "selectedAttributeId",
    })
    .populate({
      path: "user",
      select: "-passwordHash",
    })
    .sort({ orderCreateAt: -1 });

  if (!userOrderList) {
    res.status(500).json({ success: false });
  }
  res.send(userOrderList);
});

router.get(`/get/productorders/:mainProduct`, async (req, res) => {
  const productOrderList = await Order.find({
    mainProduct: req.params.mainProduct,
  })
    .populate({
      path: "mainProduct",
      select: "name richDescription image",
    })
    .populate("sellerOffer", "sellingPrice")
    .populate({
      path: "sellerOffer",
      select: "-bidderOffer -productId",
      populate: "selectedAttributeId",
    })
    .populate({
      path: "user",
      select: "-passwordHash",
    })
    .sort({ orderCreateAt: -1 });

  if (!productOrderList) {
    res.status(500).json({ success: false });
  }
  res.send(productOrderList);
});

router.get(`/get/sizesorders/:mainProduct/:size`, async (req, res) => {
  const mainProduct = req.params.mainProduct;
  const size = req.params.size;

  const productOrderList = await Order.find({
    mainProduct: mainProduct,
    size: size,
  })
    .populate({
      path: "mainProduct",
      select: "name richDescription image",
    })
    .populate("sellerOffer", "sellingPrice")
    .populate({
      path: "sellerOffer",
      select: "-bidderOffer -productId",
      populate: "selectedAttributeId",
    })
    .populate({
      path: "user",
      select: "-passwordHash",
    })
    .sort({ orderCreateAt: -1 });

  if (!productOrderList) {
    res.status(500).json({ success: false });
  }
  res.send(productOrderList);
});

module.exports = router;

// .populate({
//       path: "orderItems",
//       populate: {
//         path: "product",
//         populate: "category",
//       },
//     })
//     .populate({
//       path: "selectedAttributeId",
//       select: "optionName",
//       populate: {
//         path: "attributeId",
//         select: "name",
//       },
//     })

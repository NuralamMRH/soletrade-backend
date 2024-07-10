const express = require("express");
const { CalenderNotify } = require("../models/calenderNotify");
const { sendPushNotification } = require("../helpers/sendPushNotification");

const router = express.Router();

router.get(`/`, async (req, res) => {
  const portfolioItemList = await CalenderNotify.find()
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
    const portfolioItem = await CalenderNotify.findById(req.params.id)
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
    const portfolioItem = new CalenderNotify({
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
    const portfolioItem = await CalenderNotify.findOneAndDelete({
      _id: req.params.id,
    });

    if (portfolioItem) {
      return res.status(200).json({
        success: true,
        message: "The Calender Notify Item is deleted!",
      });
    } else {
      return res.status(404).json({ success: false, message: "Not found!" });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.get(`/get/count`, async (req, res) => {
  try {
    const totalPortfolio = await CalenderNotify.countDocuments();

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
  const userPortfolioItems = await CalenderNotify.find({
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
  const portfolioItem = await CalenderNotify.find({
    product: req.params.product,
  })
    .populate({ path: "user", select: "-passwordHash" })
    .populate({ path: "product" });
  if (!portfolioItem) {
    res.status(500).json({ success: false });
  }
  res.send(portfolioItem);
});

module.exports = router;

const sentNotificationsCache = new Map();

// Function to trigger a single push notification asynchronously
const triggerPushNotification = async (notification) => {
  const { user, product } = notification;
  const { _id: userId } = user;
  const { _id: productId } = product;

  const userProductKey = `${userId}_${productId}`;

  // Check if this notification has already been sent for this user and product
  if (!sentNotificationsCache.has(userProductKey)) {
    const { expoPushToken: pushToken } = user;

    // Prepare and send push notification
    const notificationTitle = "Sole Calender Notification";
    const notificationBody = `${product.name} is now available!`;

    try {
      await sendPushNotification(
        pushToken,
        notificationTitle,
        notificationBody,
        { productId }
      );

      // Mark this notification as sent for this user and product
      sentNotificationsCache.set(userProductKey, true);

      console.log(
        `Push notification sent for user ${user.name} and product ${product.name}`
      );
    } catch (error) {
      console.error(
        `Error sending push notification for user ${user.name} and product ${product.name}:`,
        error
      );
      // Handle error if needed
    }
  } else {
    // console.log(
    //   `Notification already sent for user ${user.name} and product ${product.name}`
    // );
  }
};

// Main function to handle trigger notifications
const handleTriggerNotifications = async () => {
  try {
    const currentDate = new Date();

    // Find calendar notifications meeting the criteria
    const notifications = await CalenderNotify.find()
      .populate("user")
      .populate("product");

    const filteredNotifications = notifications.filter((notification) => {
      const publishDate = new Date(notification.product.publishDate);
      const userPushToken = notification.user.expoPushToken;

      return publishDate <= currentDate && userPushToken;
    });

    // console.log("Filtered Notifications:", filteredNotifications);

    if (filteredNotifications.length === 0) {
      console.log("No notifications to send");
      return;
    }

    // Process each filtered notification and trigger push notifications asynchronously
    await Promise.all(
      filteredNotifications.map(async (notification) => {
        await triggerPushNotification(notification);
      })
    );
  } catch (error) {
    console.error("Error handling trigger notifications:", error);
  }
};

// Call the function to start triggering notifications
const notificationInterval = 1000; // Every 1 minute

// Function to periodically trigger notifications
const startNotificationInterval = () => {
  setInterval(async () => {
    try {
      await handleTriggerNotifications();
    } catch (error) {
      console.error("Error in notification interval:", error);
    }
  }, notificationInterval);
};

// Start the interval for triggering notifications
startNotificationInterval();

const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const morgan = require("morgan");
const mongoose = require("mongoose");
const cors = require("cors");
const authJwt = require("./helpers/jwt");
const errorHandler = require("./helpers/error-handler");

require("dotenv/config");

// Enable CORS for all routes
app.use(cors({ origin: "*" }));

//middleware
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(authJwt());
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));
app.use(errorHandler);

//Routes
const appContentRoutes = require("./routes/appContents");
const blogRoutes = require("./routes/blogPosts");
const categoriesRoutes = require("./routes/categories");
const brandRoutes = require("./routes/brands");
const productsRoutes = require("./routes/products");
const usersRoutes = require("./routes/users");
const ordersRoutes = require("./routes/orders");
const payoutsRoutes = require("./routes/payouts");
const biddingOfferRoutes = require("./routes/biddingOffers");
const sellingRoutes = require("./routes/sellingItems");
const attributeRoutes = require("./routes/attributes");
const attributeOptionsRoutes = require("./routes/attributeOptions");
const shippingRoutes = require("./routes/shippings");

const soleCheckBrandsRoutes = require("./routes/soleCheckBrands");
const soleCheckModelsRoutes = require("./routes/soleCheckModels");
const soleCheckItemsRoutes = require("./routes/soleCheckItems");

const portfolioItemsRoutes = require("./routes/portfolioItems");
const wishlistRoutes = require("./routes/wishlists");
const soleDrawRoutes = require("./routes/soleDraws");
const calenderNotifiesRoutes = require("./routes/calenderNotifies");
const drawAttendsRoutes = require("./routes/drawAttends");
const expoPushTokens = require("./routes/expoPushTokens");

const api = process.env.API_URL;

app.use(`${api}/appcontents`, appContentRoutes);
app.use(`${api}/blogs`, blogRoutes);
app.use(`${api}/categories`, categoriesRoutes);
app.use(`${api}/brands`, brandRoutes);
app.use(`${api}/products`, productsRoutes);
app.use(`${api}/users`, usersRoutes);
app.use(`${api}/orders`, ordersRoutes);
app.use(`${api}/payouts`, payoutsRoutes);
app.use(`${api}/bidding`, biddingOfferRoutes);
app.use(`${api}/selling`, sellingRoutes);
app.use(`${api}/attributes`, attributeRoutes);
app.use(`${api}/attribute-options`, attributeOptionsRoutes);
app.use(`${api}/shipping`, shippingRoutes);

app.use(`${api}/solecheckbrand`, soleCheckBrandsRoutes);
app.use(`${api}/solecheckmodel`, soleCheckModelsRoutes);
app.use(`${api}/solecheckitems`, soleCheckItemsRoutes);

app.use(`${api}/portfolio`, portfolioItemsRoutes);

app.use(`${api}/wishlist`, wishlistRoutes);

app.use(`${api}/draws`, soleDrawRoutes);
app.use(`${api}/user-calender-notifications`, calenderNotifiesRoutes);
app.use(`${api}/draw-joins`, drawAttendsRoutes);

app.use(`${api}/expoPushTokens`, expoPushTokens);

//Database
mongoose
  .connect(process.env.CONNECTION_STRING, {
    dbName: "test-db",
  })
  .then(() => {
    console.log("Database Connection is ready...");
  })
  .catch((err) => {
    console.log(err);
  });

//Server
app.listen(8000, () => {
  console.log("server is running http://localhost:8000");
});

const { exampleMiddleware } = require("../middleware");
const exampleController = require("../controllers/exampleController");

module.exports = (app) => {
  app.use((req, res, next) => {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  const router = require("express").Router();
  app.use("/api/data", router);

  router.get(
    "/",
    exampleController.refactoreMe1
  );

  router.post(
    "/",
    [exampleMiddleware.exampleMiddlewareFunction],
    exampleController.refactoreMe2
  );

  router.get(
    "/get",
    [exampleMiddleware.exampleMiddlewareFunction],
    exampleController.getData
  );
};

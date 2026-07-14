import { Hono } from "hono";
import { userController } from "./controller/user-controller";
import { logger } from "./applications/logging";

const app = new Hono();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});
app.route("/", userController);
app.onError((err, c) => {
  logger.error(err);
  return c.json(
    {
      status: "error",
      message: "Internal server error",
    },
    500
  );
});

export default app;

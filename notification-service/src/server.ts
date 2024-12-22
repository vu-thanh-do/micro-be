import app from "./app";
import { config } from "./config";
app.listen(config.port, () => {
  console.log(`API notification running on port ${config.port}`);
});

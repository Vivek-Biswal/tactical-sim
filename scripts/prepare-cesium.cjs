const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const source = path.join(root, "node_modules", "cesium", "Build", "Cesium");
const destination = path.join(root, "public", "cesium");
fs.mkdirSync(destination, { recursive: true });
fs.cpSync(source, destination, { recursive: true, force: true });
console.log("Cesium browser runtime, workers and assets prepared.");

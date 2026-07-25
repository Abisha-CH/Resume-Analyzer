// test-canvas.cjs
const { createCanvas } = require("@napi-rs/canvas");

const canvas = createCanvas(100, 100);

console.log("Canvas loaded successfully");
console.log(canvas.width, canvas.height);
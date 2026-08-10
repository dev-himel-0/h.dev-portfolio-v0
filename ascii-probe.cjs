const sharp = require("sharp");
(async () => {
  const { data, info } = await sharp("last-connector-s7000b.png").raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const outW = 128, outH = 36;
  let s = "";
  for (let oy = 0; oy < outH; oy++) {
    let row = "";
    for (let ox = 0; ox < outW; ox++) {
      const px = Math.floor(W * (ox + 0.5) / outW);
      const py = Math.floor(H * (oy + 0.5) / outH);
      const i = (py * W + px) * 4;
      const lum = 0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2];
      row += lum > 235 ? "." : lum > 180 ? ":" : lum > 120 ? "o" : lum > 60 ? "#" : "@";
    }
    s += row + "\n";
  }
  console.log(s);
})();

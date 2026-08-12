export default class SpriteGenerator {
  constructor(canvasId, outputId) {
    this.canvas = document.getElementById(canvasId);
    this.context = this.canvas.getContext("2d");
    this.dataOutput = document.getElementById(outputId);
  }

  processDimensions(images, settings) {
    let spriteWidth = 0; let spriteHeight = 0;
    const { layout, margin, extrude } = settings;

    if (images.length === 0) return { spriteWidth, spriteHeight };

    if (layout === "vertical") {
      spriteWidth = Math.max(...images.map(img => img.width + (extrude * 2)));
      spriteHeight = images.reduce((sum, img) => sum + img.height + (extrude * 2) + margin, 0) - margin;
    } else if (layout === "horizontal") {
      spriteWidth = images.reduce((sum, img) => sum + img.width + (extrude * 2) + margin, 0) - margin;
      spriteHeight = Math.max(...images.map(img => img.height + (extrude * 2)));
    } else if (layout === "grid") {
      const numCols = Math.ceil(Math.sqrt(images.length));
      const numRows = Math.ceil(images.length / numCols);
      spriteWidth = (numCols * Math.max(...images.map(img => img.width + (extrude * 2)))) + ((numCols - 1) * margin);
      spriteHeight = (numRows * Math.max(...images.map(img => img.height + (extrude * 2)))) + ((numRows - 1) * margin);
    }

    return { spriteWidth, spriteHeight };
  }

  generate(images, settings) {
    const { layout, margin, extrude, baseName, format: codeFormat } = settings;
    const { spriteWidth, spriteHeight } = this.processDimensions(images, settings);

    this.canvas.width = spriteWidth;
    this.canvas.height = spriteHeight;
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    let cssStr = "";
    let jsonData = {
      frames: {},
      meta: { image: `${baseName}.png`, format: "RGBA8888", size: { w: spriteWidth, h: spriteHeight }, scale: "1" }
    };

    let offsetX = 0; let offsetY = 0; let rowHeight = 0;

    images.forEach((img, index) => {
      let currentX = 0; let currentY = 0;
      const totalImgWidth = img.width + (extrude * 2);
      const totalImgHeight = img.height + (extrude * 2);

      if (layout === "vertical") {
        currentX = 0; currentY = offsetY; offsetY += totalImgHeight + margin;
      } else if (layout === "horizontal") {
        currentX = offsetX; currentY = 0; offsetX += totalImgWidth + margin;
      } else if (layout === "grid") {
        if (offsetX + totalImgWidth > spriteWidth) { offsetX = 0; offsetY += rowHeight + margin; rowHeight = 0; }
        currentX = offsetX; currentY = offsetY;
        rowHeight = Math.max(rowHeight, totalImgHeight);
        offsetX += totalImgWidth + margin;
      }

      if (extrude > 0) this.drawExtrusion(img, currentX, currentY, extrude);

      const actualImageX = currentX + extrude;
      const actualImageY = currentY + extrude;
      this.context.drawImage(img, actualImageX, actualImageY);

      const frameName = `${baseName}-${index}`;
      if (codeFormat === "css") {
        cssStr += `.${frameName} {\n  width: ${img.width}px;\n  height: ${img.height}px;\n  background: url("${baseName}.png") -${actualImageX}px -${actualImageY}px;\n}\n\n`;
      } else {
        jsonData.frames[frameName] = {
          frame: { x: actualImageX, y: actualImageY, w: img.width, h: img.height },
          rotated: false, trimmed: false,
          spriteSourceSize: { x: 0, y: 0, w: img.width, h: img.height },
          sourceSize: { w: img.width, h: img.height }
        };
      }
    });

    const finalOutputText = codeFormat === "css" ? cssStr.trim() : JSON.stringify(jsonData, null, 2);
    this.dataOutput.value = finalOutputText;

    return finalOutputText;
  }

  drawExtrusion(img, currentX, currentY, extrude) {
    // Edges
    this.context.drawImage(img, 0, 0, img.width, 1, currentX + extrude, currentY, img.width, extrude);
    this.context.drawImage(img, 0, img.height - 1, img.width, 1, currentX + extrude, currentY + extrude + img.height, img.width, extrude);
    this.context.drawImage(img, 0, 0, 1, img.height, currentX, currentY + extrude, extrude, img.height);
    this.context.drawImage(img, img.width - 1, 0, 1, img.height, currentX + extrude + img.width, currentY + extrude, extrude, img.height);
    // Corners
    this.context.drawImage(img, 0, 0, 1, 1, currentX, currentY, extrude, extrude);
    this.context.drawImage(img, img.width - 1, 0, 1, 1, currentX + extrude + img.width, currentY, extrude, extrude);
    this.context.drawImage(img, 0, img.height - 1, 1, 1, currentX, currentY + extrude + img.height, extrude, extrude);
    this.context.drawImage(img, img.width - 1, img.height - 1, 1, 1, currentX + extrude + img.width, currentY + extrude + img.height, extrude, extrude);
  }

  clear() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.width = 0;
    this.canvas.height = 0;
    this.canvas.style.width = "";
    this.canvas.style.height = "";
    if (this.dataOutput) this.dataOutput.value = "";
  }
}
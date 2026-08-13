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

  generateCanvas(images, settings) {
    if (!this.canvas) return;

    if (!images || images.length === 0) {
      this.clear();

      return null;
    }

    const { layout, margin, extrude } = settings;
    const { spriteWidth, spriteHeight } = this.processDimensions(images, settings);

    this.canvas.width = spriteWidth;
    this.canvas.height = spriteHeight;
    this.canvas.parentElement?.removeAttribute("hidden");
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    let offsetX = 0; let offsetY = 0; let rowHeight = 0;
    const framesData = [];

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

      framesData.push({
        name: img.dataset.filename || `sprite-${index + 1}`,
        x: actualImageX,
        y: actualImageY,
        w: img.width,
        h: img.height
      });
    });

    return { spriteWidth, spriteHeight, framesData };
  }

  generateCode(metadata, settings, format) {
    if (!metadata) {
      if (this.dataOutput) this.dataOutput.value = "";

      return "";
    }

    const { spriteWidth, spriteHeight, framesData } = metadata;
    const { baseName } = settings;
    const imgFileName = `${baseName}.png`;

    let outputText = "";

    if (format === "css") {
      framesData.forEach(frame => {
        outputText += `.${frame.name} {\n  width: ${frame.w}px;\n  height: ${frame.h}px;\n  background: url("${imgFileName}") -${frame.x}px -${frame.y}px;\n}\n\n`;
      });
    } else {
      const jsonData = {
        frames: {},
        meta: { image: imgFileName, format: "RGBA8888", size: { w: spriteWidth, h: spriteHeight }, scale: "1" }
      };

      framesData.forEach(frame => {
        jsonData.frames[frame.name] = {
          frame: { x: frame.x, y: frame.y, w: frame.w, h: frame.h },
          rotated: false, trimmed: false,
          spriteSourceSize: { x: 0, y: 0, w: frame.w, h: frame.h },
          sourceSize: { w: frame.w, h: frame.h }
        };
      });
      outputText = JSON.stringify(jsonData, null, 2);
    }

    if (this.dataOutput) this.dataOutput.value = outputText.trim();

    return outputText;
  }

  drawExtrusion(img, currentX, currentY, extrude) {
    // Draw extrusion on edges
    this.context.drawImage(img, 0, 0, img.width, 1, currentX + extrude, currentY, img.width, extrude);
    this.context.drawImage(img, 0, img.height - 1, img.width, 1, currentX + extrude, currentY + extrude + img.height, img.width, extrude);
    this.context.drawImage(img, 0, 0, 1, img.height, currentX, currentY + extrude, extrude, img.height);
    this.context.drawImage(img, img.width - 1, 0, 1, img.height, currentX + extrude + img.width, currentY + extrude, extrude, img.height);
    // Draw extrusion on corners
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
    this.canvas.parentElement.setAttribute("hidden", "");
    if (this.dataOutput) this.dataOutput.value = "";
  }
}
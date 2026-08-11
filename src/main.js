const dropZone = document.getElementById("dropZone");
const imageInput = document.getElementById("imageInput");
const addImagesBtn = document.getElementById("addImages");
const imageContainer = document.getElementById("imageContainer");

const spriteNameInput = document.getElementById("spriteName");
const spriteMarginInput = document.getElementById("spriteMargin");
const spriteExtrudeInput = document.getElementById("spriteExtrude");
const exportBtn = document.getElementById("exportFormat");

const spriteOutputLabel = document.getElementById("outputLabel");
const dataOutput = document.getElementById("dataOutput");

const previewBtn = document.getElementById("previewSprite");
const downloadSpriteComp = document.getElementById("downloadSpriteComp");
const resetBtn = document.getElementById("resetAll");

const canvasZoom = document.getElementById("canvasZoom");
const zoomValue = document.getElementById("zoomValue");
const canvas = document.getElementById("spriteCanvas");

const copyBtn = document.getElementById("copyCode");

let draggedImage = null;
let currentDownloadConfig = { action: "both", format: "png" };

// Drag & Drop events for the upload zone
addImagesBtn.addEventListener("click", () => imageInput.click());
imageInput.addEventListener("change", (e) => handleFiles(e.target.files));

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  dropZone.classList.add("drag-over");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("drag-over");
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  dropZone.classList.remove("drag-over");
  handleFiles(e.dataTransfer.files);
});

// Custom Drag-and-Drop Reordering
imageContainer?.addEventListener("dragstart", (e) => {
  if (e.target.tagName === "IMG") {
    draggedImage = e.target;
    setTimeout(() => e.target.classList.add("dragging"), 0);
  }
});

imageContainer?.addEventListener("dragend", (e) => {
  if (e.target.tagName === "IMG") {
    e.target.classList.remove("dragging");
    draggedImage = null;
    document.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over"));
  }
});

imageContainer?.addEventListener("dragover", (e) => {
  e.preventDefault(); // Necessary to allow dropping
  if (e.target.tagName === "IMG" && e.target !== draggedImage) {
    // Determine if we are hovering on the left or right half of the image
    const rect = e.target.getBoundingClientRect();
    const insertAfter = (e.clientX - rect.left) / (rect.right - rect.left) > 0.5;

    if (insertAfter) {
      e.target.after(draggedImage);
    } else {
      e.target.before(draggedImage);
    }
  }
});


// UI Controls & Canvas Zoom
previewBtn?.addEventListener("click", () => generateSprite(false));
downloadSpriteComp?.addEventListener("execute", (ev) => {
  currentDownloadConfig = ev.detail;
  generateSprite(true);
});
exportBtn?.addEventListener("change", (e) => {
  if (spriteOutputLabel) spriteOutputLabel.innerText = `Output Data (${e.target.value.toUpperCase()})`;
});

resetBtn?.addEventListener("click", () => {
  // 1. Clear uploaded images
  const images = imageContainer.querySelectorAll("img");
  images.forEach(img => img.remove());

  // 2. Clear form inputs and code output
  if (spriteNameInput) spriteNameInput.value = "";
  if (spriteMarginInput) spriteMarginInput.value = "5";
  if (spriteExtrudeInput) spriteExtrudeInput.value = "0";
  if (exportBtn) exportBtn.value = "css";
  if (spriteOutputLabel) spriteOutputLabel.innerText = "Output Data (CSS)";
  if (dataOutput) dataOutput.value = "";

  // 3. Reset layout radio back to vertical
  const verticalRadio = document.querySelector("input[name=\"layout\"][value=\"vertical\"]");
  if (verticalRadio) verticalRadio.checked = true;

  // 4. Clear preview canvas and reset zoom
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);

  canvas.width = 0;
  canvas.height = 0;

  canvas.style.width = "";
  canvas.style.height = "";

  if (canvasZoom) canvasZoom.value = "100";
  if (zoomValue) zoomValue.innerText = "100%";

  // 5. Clear file input memory
  if (imageInput) imageInput.value = "";
});

canvasZoom?.addEventListener("input", (e) => {
  const scale = e.target.value;
  zoomValue.innerText = `${scale}%`;

  // Scale the canvas visually using CSS width/height so scrollbars adapt properly
  if (canvas.width > 0) {
    canvas.style.width = `${canvas.width * (scale / 100)}px`;
    canvas.style.height = `${canvas.height * (scale / 100)}px`;
  }
});

// Copy to Clipboard Logic
copyBtn?.addEventListener("click", async (e) => {
  const btn = e.currentTarget;
  const textToCopy = dataOutput.value ?? "";

  if (!textToCopy) return;

  try {
    await navigator.clipboard.writeText(textToCopy);
    const originalHTML = btn.innerHTML;
    btn.innerHTML = `<span style="font-size: 12px; font-weight: bold; padding: 0 4px;">Copied!</span>`;
    btn.classList.add("success");

    setTimeout(() => {
      btn.innerHTML = originalHTML;
      btn.classList.remove("success");
    }, 2000);
  } catch (err) {
    console.error("Failed to copy text: ", err);
  }
});

function handleFiles(files) {
  Array.from(files).forEach(file => {
    if (!file.type.startsWith("image/")) return; // Skip non-images

    const image = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      image.src = e.target.result;
      image.draggable = true; // Enable HTML5 dragging
      imageContainer.appendChild(image);
    };
    reader.readAsDataURL(file);
  });
}

function getSettings() {
  const layout = document.querySelector("input[name=\"layout\"]:checked").value;
  const marginInput = spriteMarginInput?.value ?? 0;
  const margin = marginInput !== "" ? parseInt(marginInput, 10) : 5;

  const extrudeInput = spriteExtrudeInput?.value ?? 0;
  const extrude = extrudeInput !== "" ? parseInt(extrudeInput, 10) : 0;

  const nameInput = spriteNameInput?.value.trim() ?? "";
  const baseName = nameInput !== "" ? nameInput : "sprite";
  const dataFileFormat = exportBtn?.value ?? "css";

  return { layout, margin, extrude, baseName, format: dataFileFormat };
}

function processImages() {
  const images = Array.from(imageContainer.getElementsByTagName("img"));
  const { layout, margin, extrude } = getSettings();

  let spriteWidth = 0;
  let spriteHeight = 0;

  if (images.length === 0) return { images: [], spriteWidth, spriteHeight };

  // Calculate dimensions including extrusion on all sides (extrude * 2 per image)
  if (layout === "vertical") {
    spriteWidth = Math.max(...images.map((img) => img.width + (extrude * 2)));
    spriteHeight = images.reduce((sum, img) => sum + img.height + (extrude * 2) + margin, 0) - margin;
  } else if (layout === "horizontal") {
    spriteWidth = images.reduce((sum, img) => sum + img.width + (extrude * 2) + margin, 0) - margin;
    spriteHeight = Math.max(...images.map((img) => img.height + (extrude * 2)));
  } else if (layout === "grid") {
    const numCols = Math.ceil(Math.sqrt(images.length));
    const numRows = Math.ceil(images.length / numCols);

    spriteWidth = (numCols * Math.max(...images.map((img) => img.width + (extrude * 2)))) + ((numCols - 1) * margin);
    spriteHeight = (numRows * Math.max(...images.map((img) => img.height + (extrude * 2)))) + ((numRows - 1) * margin);
  }

  return { images, spriteWidth, spriteHeight, margin, extrude, layout };
}

async function generateSprite(isDownloadTriggered = false) {
  const { images, spriteWidth, spriteHeight, margin, extrude, layout } = processImages();
  const { baseName, format: codeFormat } = getSettings();

  if (images.length === 0) {
    alert("Please add some images first.");
    return;
  }

  const context = canvas.getContext("2d");
  const dataOutput = document.getElementById("dataOutput");

  canvas.width = spriteWidth;
  canvas.height = spriteHeight;

  // Trigger a resize based on current zoom setting
  canvasZoom.dispatchEvent(new Event("input"));
  context.clearRect(0, 0, canvas.width, canvas.height);

  let cssStr = "";
  let jsonData = {
    frames: {},
    meta: {
      image: `${baseName}.png`,
      format: "RGBA8888",
      size: { w: spriteWidth, h: spriteHeight },
      scale: "1"
    }
  };

  let offsetX = 0;
  let offsetY = 0;
  let rowHeight = 0;

  images.forEach((img, index) => {
    let currentX = 0;
    let currentY = 0;
    const totalImgWidth = img.width + (extrude * 2);
    const totalImgHeight = img.height + (extrude * 2);

    if (layout === "vertical") {
      currentX = 0;
      currentY = offsetY;
      offsetY += totalImgHeight + margin;
    } else if (layout === "horizontal") {
      currentX = offsetX;
      currentY = 0;
      offsetX += totalImgWidth + margin;
    } else if (layout === "grid") {
      if (offsetX + totalImgWidth > spriteWidth) {
        offsetX = 0;
        offsetY += rowHeight + margin;
        rowHeight = 0;
      }
      currentX = offsetX;
      currentY = offsetY;
      rowHeight = Math.max(rowHeight, totalImgHeight);
      offsetX += totalImgWidth + margin;
    }

    // Draw Extrusion (Edge Bleed)
    if (extrude > 0) {
      // Edges
      context.drawImage(img, 0, 0, img.width, 1, currentX + extrude, currentY, img.width, extrude); // Top
      context.drawImage(img, 0, img.height - 1, img.width, 1, currentX + extrude, currentY + extrude + img.height, img.width, extrude); // Bottom
      context.drawImage(img, 0, 0, 1, img.height, currentX, currentY + extrude, extrude, img.height); // Left
      context.drawImage(img, img.width - 1, 0, 1, img.height, currentX + extrude + img.width, currentY + extrude, extrude, img.height); // Right

      // Corners
      context.drawImage(img, 0, 0, 1, 1, currentX, currentY, extrude, extrude); // Top-Left
      context.drawImage(img, img.width - 1, 0, 1, 1, currentX + extrude + img.width, currentY, extrude, extrude); // Top-Right
      context.drawImage(img, 0, img.height - 1, 1, 1, currentX, currentY + extrude + img.height, extrude, extrude); // Bottom-Left
      context.drawImage(img, img.width - 1, img.height - 1, 1, 1, currentX + extrude + img.width, currentY + extrude + img.height, extrude, extrude); // Bottom-Right
    }

    // Draw Main Image
    const actualImageX = currentX + extrude;
    const actualImageY = currentY + extrude;
    context.drawImage(img, actualImageX, actualImageY);

    // Generate Data
    const frameName = `${baseName}-${index}`;

    if (codeFormat === "css") {
      cssStr += `.${frameName} {\n  width: ${img.width}px;\n  height: ${img.height}px;\n  background: url("${baseName}.png") -${actualImageX}px -${actualImageY}px;\n}\n\n`;
    } else {
      jsonData.frames[frameName] = {
        frame: { x: actualImageX, y: actualImageY, w: img.width, h: img.height },
        rotated: false,
        trimmed: false,
        spriteSourceSize: { x: 0, y: 0, w: img.width, h: img.height },
        sourceSize: { w: img.width, h: img.height }
      };
    }
  });

  const finalOutputText = codeFormat === "css" ? cssStr.trim() : JSON.stringify(jsonData, null, 2);
  dataOutput.value = finalOutputText;

  if (isDownloadTriggered) {
    const { action, format: imgFormat } = currentDownloadConfig;

    // Derived Mime Types
    const codeMimeType = codeFormat === "css" ? "text/css" : "application/json";
    const imageMimeType = `image/${imgFormat === 'jpg' ? 'jpeg' : imgFormat}`;

    // 1. Download Both (Forced Fallback to Anchor)
    if (action === "both") {
      const blob = await getCanvasBlob(canvas, imageMimeType);

      // Helper defined below
      if (blob) downloadViaAnchor(blob, `${baseName}.${imgFormat}`, imageMimeType);
      downloadViaAnchor(finalOutputText, `${baseName}.${codeFormat}`, codeMimeType);
    }
    // 2. Download Image Only (Uses FilePicker if available)
    else if (action === "image") {
      const blob = await getCanvasBlob(canvas, imageMimeType);
      if (blob) await saveFile(blob, `${baseName}.${imgFormat}`, imgFormat);
    }
    // 3. Download Code Only (Uses FilePicker if available)
    else if (action === "code") {
      await saveFile(finalOutputText, `${baseName}.${codeFormat}`, codeFormat);
    }
  }
}
/**
 * Helper to convert canvas.toBlob into a Promise for cleaner async/await flow.
 * @param {HTMLCanvasElement} canvas
 * @returns {Promise<unknown>}
 */
function getCanvasBlob(canvas) {
  return new Promise(resolve => canvas.toBlob(resolve));
}

/** Utility to handle simultaneous downloads via virtual anchor click */
function downloadViaAnchor(data, filename, mimeType) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/** Utility to handle single file download */
async function saveFile(data, filename, format) {
  // Determine mime type based on format
  const mimeTypes = {
    "css": "text/css",
    "json": "application/json",
    "png": "image/png"
  };
  const mimeType = mimeTypes[format] || "text/plain";

  if (!Object.prototype.hasOwnProperty.call(window, "showSaveFilePicker")) {
    // Fallback: Create blob, create URL, click anchor element, revoke URL
    return downloadViaAnchor(data, filename, mimeType);
  }

  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [{
        description: `${format.toUpperCase()} File`,
        accept: {
          [mimeType]: [`.${format}`]
        }
      }]
    });

    const writable = await handle.createWritable();
    await writable.write(data);
    await writable.close();
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error("Failed to save file:", err);
    }
  }
}
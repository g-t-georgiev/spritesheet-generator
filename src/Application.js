import ImageUploader from './modules/ImageUploader.js';
import SpriteGenerator from './modules/SpriteGenerator.js';
import FileExporter from './modules/FileExporter.js';

export default class Application {
  constructor() {
    this.uploader = new ImageUploader("dropZone", "imageInput", "addImages", "imageContainer");
    this.generator = new SpriteGenerator("spriteCanvas", "dataOutput");
    this.currentDownloadConfig = { action: "both", format: "png" };

    this.initUIElements();
    this.bindEvents();
  }

  initUIElements() {
    this.spriteNameInput = document.getElementById("spriteName");
    this.spriteMarginInput = document.getElementById("spriteMargin");
    this.spriteExtrudeInput = document.getElementById("spriteExtrude");
    this.exportBtn = document.getElementById("exportFormat");
    this.spriteOutputLabel = document.getElementById("outputLabel");

    this.previewBtn = document.getElementById("previewSprite");
    this.downloadSpriteComp = document.getElementById("downloadSpriteComp");
    this.resetBtn = document.getElementById("resetAll");
    this.copyBtn = document.getElementById("copyCode");

    this.canvasZoom = document.getElementById("canvasZoom");
    this.zoomValue = document.getElementById("zoomValue");
  }

  bindEvents() {
    this.previewBtn?.addEventListener("click", () => this.handleGenerate(false));

    this.downloadSpriteComp?.addEventListener("execute", (ev) => {
      this.currentDownloadConfig = ev.detail;
      this.handleGenerate(true);
    });

    this.exportBtn?.addEventListener("change", (e) => {
      if (this.spriteOutputLabel)
        this.spriteOutputLabel.innerText = `Output Data (${e.target.value.toUpperCase()})`;
    });

    this.resetBtn?.addEventListener("click", () => this.handleReset());
    this.copyBtn?.addEventListener("click", (e) => this.handleCopy(e));
    this.canvasZoom?.addEventListener("input", (e) => this.handleZoom(e));
  }

  getSettings() {
    const layout = document.querySelector("input[name=\"layout\"]:checked").value;
    const margin = parseInt(this.spriteMarginInput?.value || 5, 10);
    const extrude = parseInt(this.spriteExtrudeInput?.value || 0, 10);
    const baseName = this.spriteNameInput?.value.trim() || "sprite";
    const format = this.exportBtn?.value || "css";
    return { layout, margin, extrude, baseName, format };
  }

  async handleGenerate(isDownloadTriggered = false) {
    const images = this.uploader.getImages();
    if (images.length === 0) return alert("Please add some images first.");

    const settings = this.getSettings();
    const outputText = this.generator.generate(images, settings);

    // Trigger zoom to update visual canvas size
    this.canvasZoom?.dispatchEvent(new Event("input"));

    if (isDownloadTriggered) {
      await this.processDownload(outputText, settings.baseName, settings.format);
    }
  }

  async processDownload(outputText, baseName, codeFormat) {
    const { action, format: imgFormat } = this.currentDownloadConfig;
    const codeMimeType = codeFormat === "css" ? "text/css" : "application/json";
    const imageMimeType = `image/${imgFormat === 'jpg' ? 'jpeg' : imgFormat}`;

    if (action === "both" || action === "image") {
      const blob = await FileExporter.getCanvasBlob(this.generator.canvas);
      if (blob) {
        if (action === "both") FileExporter.downloadViaAnchor(blob, `${baseName}.${imgFormat}`, imageMimeType);
        else await FileExporter.saveFile(blob, `${baseName}.${imgFormat}`, imgFormat);
      }
    }

    if (action === "both" || action === "code") {
      if (action === "both") FileExporter.downloadViaAnchor(outputText, `${baseName}.${codeFormat}`, codeMimeType);
      else await FileExporter.saveFile(outputText, `${baseName}.${codeFormat}`, codeFormat);
    }
  }

  handleReset() {
    this.uploader.clear();
    this.generator.clear();

    if (this.spriteNameInput) this.spriteNameInput.value = "";
    if (this.spriteMarginInput) this.spriteMarginInput.value = "5";
    if (this.spriteExtrudeInput) this.spriteExtrudeInput.value = "0";
    if (this.exportBtn) this.exportBtn.value = "css";
    if (this.spriteOutputLabel) this.spriteOutputLabel.innerText = "Output Data (CSS)";

    const verticalRadio = document.querySelector("input[name=\"layout\"][value=\"vertical\"]");
    if (verticalRadio) verticalRadio.checked = true;

    if (this.canvasZoom) this.canvasZoom.value = "100";
    if (this.zoomValue) this.zoomValue.innerText = "100%";
  }

  async handleCopy(e) {
    const btn = e.currentTarget;
    const textToCopy = this.generator.dataOutput.value || "";
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      const originalHTML = btn.innerHTML;
      btn.innerHTML = `<span style="font-size: 12px; font-weight: bold; padding: 0 4px;">Copied!</span>`;
      btn.classList.add("success");
      setTimeout(() => { btn.innerHTML = originalHTML; btn.classList.remove("success"); }, 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  }

  handleZoom(e) {
    const scale = e.target.value;
    this.zoomValue.innerText = `${scale}%`;
    if (this.generator.canvas.width > 0) {
      this.generator.canvas.style.width = `${this.generator.canvas.width * (scale / 100)}px`;
      this.generator.canvas.style.height = `${this.generator.canvas.height * (scale / 100)}px`;
    }
  }
}
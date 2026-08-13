import ImageUploader from "./modules/ImageUploader.js";
import SpriteGenerator from "./modules/SpriteGenerator.js";
import FileExporter from "./modules/FileExporter.js";
import Store from "./Store.js";
import { debounce } from "./utils.js";


const DEFAULT_STATE = {
  images: [],
  settings: { layout: "vertical", margin: 5, extrude: 0, baseName: "sprite" },
  format: "css",
  preview: {
    zoom: 100,
  }
};
export default class Application {
  constructor() {
    this.uploader = new ImageUploader("dropZone", "imageInput", "addImages", "imageContainer");
    this.generator = new SpriteGenerator("spriteCanvas", "dataOutput");
    this.currentDownloadConfig = { action: "both", format: "png" };

    /** Cache to hold spatial data between code format changes */
    this.currentCanvasMetadata = null;
    this.store = new Store(DEFAULT_STATE);

    this.initUIElements();
    this.bindEvents();
    this.setupReactivity();
  }

  initUIElements() {
    this.spriteNameInput = document.getElementById("spriteName");
    this.spriteMarginInput = document.getElementById("spriteMargin");
    this.spriteExtrudeInput = document.getElementById("spriteExtrude");
    this.exportBtn = document.getElementById("exportFormat");
    this.spriteOutputLabel = document.getElementById("outputLabel");
    this.layoutRadios = document.querySelectorAll("input[name=\"layout\"]");

    this.downloadSpriteComp = document.getElementById("downloadSpriteComp");
    this.clearBtn = document.getElementById("resetAll");

    this.canvasZoom = document.getElementById("canvasZoom");
    this.zoomValue = document.getElementById("zoomValue");

    this.copyBtn = document.getElementById("copyCode");
  }

  bindEvents() {
    this.uploader.onImagesChange = (action, images = []) => {
      console.log(`action: ${action}, images: ${images?.length}`);

      if (!images?.length) {
        this.handleReset();

        return;
      }

      this.store.set("images", images);
    };

    const handleRenderSettingsChange = debounce(() => {
      const newSettingsState = this.getDisplayedSettingsState();
      this.store.set("settings", { ...newSettingsState });
    }, 200);

    this.spriteNameInput?.addEventListener("input", handleRenderSettingsChange);
    this.spriteMarginInput?.addEventListener("input", handleRenderSettingsChange);
    this.spriteExtrudeInput?.addEventListener("input", handleRenderSettingsChange);
    this.layoutRadios.forEach((radio) => radio.addEventListener("change", handleRenderSettingsChange));

    this.downloadSpriteComp?.addEventListener("execute", (ev) => {
      this.currentDownloadConfig = ev.detail;
      this.handleFileDownloads(true);
    });

    const handleFormatSettingsChange = debounce((ev) => this.store.set("format", ev.target.value), 200);
    this.exportBtn?.addEventListener("change", handleFormatSettingsChange);

    this.clearBtn?.addEventListener("click", () => this.handleReset());
    this.copyBtn?.addEventListener("click", (ev) => this.handleCopy(ev));
    this.canvasZoom?.addEventListener("input", (ev) => this.handleZoom(ev));
  }

  setupReactivity() {
    const generateFull = () => {
      const images = this.store.get("images");
      const settings = this.store.get("settings");
      const format = this.store.get("format");

      this.currentCanvasMetadata = this.generator.generateCanvas(images, settings);
      this.generator.generateCode(this.currentCanvasMetadata, settings, format);

      console.trace("HERE");
      this.canvasZoom?.dispatchEvent(new Event("input"));
    };

    const debouncedGenerate = debounce(generateFull, 50);

    this.store.subscribe("images", debouncedGenerate);
    this.store.subscribe("settings", debouncedGenerate);

    this.store.subscribe("format", (format) => {
      if (this.spriteOutputLabel) this.spriteOutputLabel.innerText = `Output Data (${format.toUpperCase()})`;

      const settings = this.store.get("settings");
      this.generator.generateCode(this.currentCanvasMetadata, settings, format);
    });
  }

  getDisplayedSettingsState() {
    const layout = document.querySelector("input[name=\"layout\"]:checked").value || DEFAULT_STATE.settings.layout;
    const margin = parseInt(this.spriteMarginInput?.value || DEFAULT_STATE.settings.margin, 10);
    const extrude = parseInt(this.spriteExtrudeInput?.value || DEFAULT_STATE.settings.extrude, 10);
    const baseName = this.spriteNameInput?.value.trim() || DEFAULT_STATE.settings.baseName;
    const format = this.exportBtn?.value || DEFAULT_STATE.format;

    return { layout, margin, extrude, baseName, format };
  }

  async handleFileDownloads(isDownloadTriggered = false) {
    const images = this.uploader.getImages();

    if (images.length === 0) return alert("Please add some images first.");

    const settings = this.getDisplayedSettingsState();
    const metadata = this.generator.generateCanvas(images, settings);
    const outputText = this.generator.generateCode(metadata, settings, settings.format);

    this.canvasZoom?.dispatchEvent(new Event("input"));

    if (!isDownloadTriggered) return;

    await this.processDownload(outputText, settings.baseName, settings.format);
  }

  async processDownload(outputText, baseName, codeFormat) {
    const { action, format: imgFormat } = this.currentDownloadConfig;
    const codeMimeType = codeFormat === "css" ? "text/css" : "application/json";
    const imageMimeType = `image/${imgFormat === "jpg" ? "jpeg" : imgFormat}`;

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
    this.currentCanvasMetadata = null;

    this.generator.clear();

    if (this.spriteNameInput) this.spriteNameInput.value = "";
    if (this.spriteMarginInput) this.spriteMarginInput.value = DEFAULT_STATE.settings.margin;
    if (this.spriteExtrudeInput) this.spriteExtrudeInput.value = DEFAULT_STATE.settings.extrude;
    if (this.exportBtn) this.exportBtn.value = DEFAULT_STATE.format;
    if (this.canvasZoom) this.canvasZoom.value = DEFAULT_STATE.preview.zoom;
    if (this.zoomValue) this.zoomValue.innerText = `${DEFAULT_STATE.preview.zoom}%`;

    const defaultRadio = document.querySelector(`input[name="layout"][value="${DEFAULT_STATE.settings.layout}"]`);
    if (defaultRadio) defaultRadio.checked = true;

    const freshState = structuredClone(DEFAULT_STATE);
    Object.keys(freshState).forEach((key) => this.store.set(key, freshState[key]));
  }

  async handleCopy(ev) {
    const btn = ev.currentTarget;
    const textToCopy = this.generator.dataOutput.value || "";
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
      console.error("Failed to copy text:\n", err);
    }
  }

  handleZoom(ev) {
    const scale = ev.target.value;
    console.log(scale);
    if (this.zoomValue) this.zoomValue.innerText = `${scale}%`;

    if (this.generator.canvas.width > 0) {
      this.generator.canvas.style.width = `${this.generator.canvas.width * (scale / 100)}px`;
      this.generator.canvas.style.height = `${this.generator.canvas.height * (scale / 100)}px`;
    }
  }
}
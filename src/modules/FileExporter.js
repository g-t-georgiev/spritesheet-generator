const MIME_TYPES = {
  "css": "text/css",
  "json": "application/json",
  "png": "image/png",
};

export default class FileExporter {
  static getCanvasBlob(canvas) {
    return new Promise(resolve => canvas.toBlob(resolve));
  }

  static downloadViaAnchor(data, filename, mimeType) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  static async saveFile(data, filename, format) {
    const mimeType = MIME_TYPES[format] || "text/plain";

    if (!Object.prototype.hasOwnProperty.call(window, "showSaveFilePicker")) {
      return this.downloadViaAnchor(data, filename, mimeType);
    }

    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{
          description: `${format.toUpperCase()} File`,
          accept: { [mimeType]: [`.${format}`] }
        }]
      });

      const writable = await handle.createWritable();
      await writable.write(data);
      await writable.close();
    } catch (err) {
      if (err.name !== 'AbortError') console.error("Failed to save file:", err);
    }
  }
}
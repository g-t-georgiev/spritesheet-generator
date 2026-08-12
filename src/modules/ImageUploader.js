export default class ImageUploader {
  constructor(dropZoneId, imageInputId, addImagesBtnId, imageContainerId) {
    this.dropZone = document.getElementById(dropZoneId);
    this.imageInput = document.getElementById(imageInputId);
    this.addImagesBtn = document.getElementById(addImagesBtnId);
    this.imageContainer = document.getElementById(imageContainerId);

    this.draggedImage = null;

    this.initEvents();
  }

  initEvents() {
    this.addImagesBtn?.addEventListener("click", () => this.imageInput.click());
    this.imageInput?.addEventListener("change", (e) => this.handleFiles(e.target.files));

    this.dropZone?.addEventListener("dragover", (e) => {
      e.preventDefault();
      this.dropZone.classList.add("drag-over");
    });

    this.dropZone?.addEventListener("dragleave", () => this.dropZone.classList.remove("drag-over"));

    this.dropZone?.addEventListener("drop", (e) => {
      e.preventDefault();
      this.dropZone.classList.remove("drag-over");
      this.handleFiles(e.dataTransfer.files);
    });

    // Custom Drag-and-Drop Reordering
    this.imageContainer?.addEventListener("dragstart", (e) => {
      if (e.target.tagName === "IMG") {
        this.draggedImage = e.target;
        setTimeout(() => e.target.classList.add("dragging"), 0);
      }
    });

    this.imageContainer?.addEventListener("dragend", (e) => {
      if (e.target.tagName === "IMG") {
        e.target.classList.remove("dragging");
        this.draggedImage = null;
        document.querySelectorAll(".drag-over").forEach(el => el.classList.remove("drag-over"));
      }
    });

    this.imageContainer?.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (e.target.tagName === "IMG" && e.target !== this.draggedImage) {
        const rect = e.target.getBoundingClientRect();
        const insertAfter = (e.clientX - rect.left) / (rect.right - rect.left) > 0.5;
        if (insertAfter) e.target.after(this.draggedImage);
        else e.target.before(this.draggedImage);
      }
    });
  }

  handleFiles(files) {
    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) return;

      const image = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        image.src = e.target.result;
        image.draggable = true;
        this.imageContainer.appendChild(image);
      };
      reader.readAsDataURL(file);
    });
  }

  getImages() {
    return Array.from(this.imageContainer.getElementsByTagName("img"));
  }

  clear() {
    const images = this.imageContainer.querySelectorAll("img");
    images.forEach(img => img.remove());
    if (this.imageInput) this.imageInput.value = "";
  }
}
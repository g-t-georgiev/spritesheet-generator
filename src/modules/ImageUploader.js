export default class ImageUploader {
  constructor(dropZoneId, imageInputId, addImagesBtnId, imageContainerId) {
    this.dropZone = document.getElementById(dropZoneId);
    this.imageInput = document.getElementById(imageInputId);
    this.addImagesBtn = document.getElementById(addImagesBtnId);
    this.imageContainer = document.getElementById(imageContainerId);

    /** @private */
    this.isDragging = false;
    /** @private */
    this.draggedItem = null;

    /**
     * Callback for the app to hook into
     * @public
     */
    this.onImagesChange = null;

    this.initEvents();
    this.initObserver();
  }

  initEvents() {
    this.addImagesBtn?.addEventListener("click", () => this.imageInput.click());
    this.imageInput?.addEventListener("change", (ev) => this.handleFilesUpload(ev.target.files));

    this.dropZone?.addEventListener("dragover", (ev) => {
      ev.preventDefault();
      this.dropZone.classList.add("drag-over");
    });
    this.dropZone?.addEventListener("dragleave", () => this.dropZone.classList.remove("drag-over"));
    this.dropZone?.addEventListener("drop", (ev) => {
      ev.preventDefault();
      this.dropZone.classList.remove("drag-over");
      this.handleFilesUpload(ev.dataTransfer.files);
    });

    this.imageContainer?.addEventListener("dragstart", (ev) => {
      const wrapper = ev.target.closest(".image-wrapper");

      if (!wrapper) return;

      this.isDragging = true;
      this.draggedItem = wrapper;

      wrapper.classList.add("dragging");
      this.imageContainer.classList.add("is-dragging");
    });

    this.imageContainer?.addEventListener("dragend", (ev) => {
      const wrapper = ev.target.closest(".image-wrapper");

      if (!wrapper) return;

      wrapper.classList.remove("dragging");
      this.imageContainer.classList.remove("is-dragging");

      this.isDragging = false;
      this.draggedItem = null;

      this.onImagesChange?.("reorder", this.getImages());
    });

    this.imageContainer?.addEventListener("dragover", (ev) => {
      ev.preventDefault();

      const target = ev.target.closest(".image-wrapper");

      if (!target || target === this.draggedItem) return;

      const rect = target.getBoundingClientRect();
      const insertAfter = (ev.clientX - rect.left) / (rect.right - rect.left) > 0.5;

      if (insertAfter) target.after(this.draggedItem);
      else target.before(this.draggedItem);
    });
  }

  initObserver() {
    let cachedImagesOrder = this.getImages();

    const observer = new MutationObserver(() => {
      if (this.isDragging) return;

      const currentImagesOrder = this.getImages();

      const isSameOrder =
        cachedImagesOrder.length === currentImagesOrder.length &&
        currentImagesOrder.every((img, i) => img === cachedImagesOrder[i]);

      /** @type "add" | "delete" | "reorder" | "mixed" */
      let action = "reorder";

      if (isSameOrder) {
        action = "reorder";
      } else {
        const addedElements = currentImagesOrder.filter((img) => !cachedImagesOrder.includes(img));
        const removedElements = cachedImagesOrder.filter((img) => !currentImagesOrder.includes(img));

        if (addedElements.length > 0 && removedElements.length === 0) {
          action = "add";
        } else if (removedElements.length > 0 && addedElements.length === 0) {
          action = "delete";
        } else {
          action = "mixed";
        }
      }

      // Update state reference for the next mutation cycle
      cachedImagesOrder = currentImagesOrder;

      this.onImagesChange?.(action, currentImagesOrder);
    });

    observer.observe(this.imageContainer, { childList: true });
  }

  handleFilesUpload(files) {
    const fragment = document.createDocumentFragment();
    const loadPromises = [];

    Array.from(files).forEach(file => {
      if (!file.type.startsWith("image/")) return;

      const objectUrl = URL.createObjectURL(file);

      const wrapper = document.createElement("div");
      wrapper.className = "image-wrapper";
      wrapper.draggable = true;

      const image = new Image();

      image.dataset.filename = file.name.replace(/\.[^/.]+$/, "");

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-img-btn";
      deleteBtn.innerHTML = "&times;";
      deleteBtn.title = "Remove image";

      deleteBtn.onclick = () => {
        URL.revokeObjectURL(objectUrl);
        wrapper.remove();
      };

      wrapper.append(image, deleteBtn);
      fragment.append(wrapper);

      const promise = new Promise((res, rej) => {
        image.onload = res;
        image.onerror = () => rej(new Error(`Failed to load: ${file.name}`));
        image.src = objectUrl;
      });

      loadPromises.push(promise);
    });

    Promise.allSettled(loadPromises).then((results) => {
      results.forEach((result) => {
        if (result.status === "fulfilled") return;

        console.warn(result.reason.message);
      });
    }).finally(() => {
      this.imageContainer.appendChild(fragment);
    });
  }

  getImages() {
    return Array.from(this.imageContainer.querySelectorAll(".image-wrapper img"));
  }

  clear() {
    const images = this.imageContainer.querySelectorAll("img");

    images.forEach(img => {
      if (img.src.startsWith("blob:")) {
        URL.revokeObjectURL(img.src);
      }
    });

    this.imageContainer.innerHTML = "";
    if (this.imageInput) this.imageInput.value = "";
  }
}
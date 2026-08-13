const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: inline-block;
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 50;

      --swatch-size: 20px;
    }

    .theme-panel {
      display: flex;
      align-items: center;
      gap: 12px;
      background-color: var(--color-bg-surface, #ffffff);
      border: 1px solid var(--color-border-default, #e5e7eb);
      padding: 8px 12px;
      border-radius: 999px;
      box-shadow: 0 6px 14px var(--color-shadow-panel, rgba(0,0,0,0.1));
      transition: background-color 0.2s ease, border-color 0.2s ease;
    }

    /* Mode Toggle (Sun / Moon) */
    .mode-toggle {
      all: unset;
      position: relative;
      width: 24px;
      height: 24px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-text-primary);
      transition: color 0.2s ease;
    }

    .icon {
      position: absolute;
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
    }

    .sun-icon {
      opacity: 1;
      transform: rotate(0deg) scale(1);
    }

    .moon-icon {
      opacity: 0;
      transform: rotate(-90deg) scale(0.5);
    }

    /* State toggles for icons */
    :host([mode="dark"]) .sun-icon {
      opacity: 0;
      transform: rotate(90deg) scale(0.5);
    }

    :host([mode="dark"]) .moon-icon {
      opacity: 1;
      transform: rotate(0deg) scale(1);
    }

    .divider {
      width: 1px;
      height: 20px;
      background-color: var(--color-text-muted);
    }

    /* Swatches */
    .swatches {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .swatch {
      all: unset;
      width: var(--swatch-size);
      height: var(--swatch-size);
      border-radius: 50%;
      cursor: pointer;
      background-color: var(--theme-color);
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
      position: relative;
      transition: transform 0.2s ease;
    }

    .swatch:not(.active):hover {
      transform: scale(1.15);
    }

    /* Active Ring */
    .swatch::after {
      content: '';
      position: absolute;
      top: -4px;
      left: -4px;
      right: -4px;
      bottom: -4px;
      border-radius: 50%;
      border: 2px solid var(--theme-color);
      opacity: 0;
      transform: scale(0.8);
      transition: all 0.2s ease;
    }

    .swatch.active::after {
      opacity: 1;
      transform: scale(1);
    }
  </style>

  <div class="theme-panel">
    <button class="mode-toggle" id="modeToggle" aria-label="Toggle Light/Dark Mode" title="Toggle Light/Dark Mode">
      <svg class="icon sun-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4.5"></circle>
        <path d="M12 2.5v2"></path><path d="M12 19.5v2"></path><path d="M4.5 12H2.5"></path><path d="M21.5 12h-2"></path><path d="M5.6 5.6l-1.4-1.4"></path><path d="M19.8 19.8l-1.4-1.4"></path><path d="M5.6 18.4l-1.4 1.4"></path><path d="M19.8 4.2l-1.4 1.4"></path>
      </svg>
      <svg class="icon moon-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"></path>
      </svg>
    </button>

    <div class="divider"></div>

    <div class="swatches" id="swatchContainer">
      <!-- Configured Swatches -->
      <button class="swatch" data-theme="blue" style="--theme-color: #2196f3" title="Blue Theme"></button>
      <button class="swatch" data-theme="green" style="--theme-color: #2e7d32" title="Green Theme"></button>
      <button class="swatch" data-theme="purple" style="--theme-color: #9c27b0" title="Purple Theme"></button>
      <button class="swatch" data-theme="orange" style="--theme-color: #ff9800" title="Orange Theme"></button>
    </div>
  </div>
`;

export default class ThemeSwitcher extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.modeToggle = this.shadowRoot.getElementById("modeToggle");
    this.swatches = this.shadowRoot.querySelectorAll(".swatch");

    this.currentMode = localStorage.getItem("app-mode") || "dark";
    this.currentTheme = localStorage.getItem("app-theme") || "blue";
  }

  connectedCallback() {
    this.applyState();

    this.modeToggle.addEventListener("click", () => {
      this.currentMode = this.currentMode === "dark" ? "light" : "dark";
      this.applyState();
    });

    this.swatches.forEach(swatch => {
      swatch.addEventListener("click", (ev) => {
        this.currentTheme = ev.target.dataset.theme;
        this.applyState();
      });
    });
  }

  applyState() {
    // Update component visuals
    this.setAttribute("mode", this.currentMode);

    this.swatches.forEach(swatch => {
      swatch.classList.toggle("active", swatch.dataset.theme === this.currentTheme);
    });

    // Persist to storage
    localStorage.setItem("app-mode", this.currentMode);
    localStorage.setItem("app-theme", this.currentTheme);

    // Update global HTML document attributes
    document.documentElement.setAttribute("data-mode", this.currentMode);
    document.documentElement.setAttribute("data-theme", this.currentTheme);
  }
}

customElements.define("theme-switcher", ThemeSwitcher);
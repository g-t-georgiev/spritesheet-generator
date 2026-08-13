const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: inline-flex;
      position: relative;
      font-family: inherit;
      box-sizing: border-box;

      --split-btn-color-bg-primary: var(--color-bg-primary);
      --split-btn-color-bg-secondary: var(--color-bg-primary-hover);
      --split-btn-color-bg-default: var(--color-bg-surface);
      --split-btn-color-border-primary: var(--color-border-primary);
      --split-btn-color-border-secondary: var(--color-border-primary-hover);
      --split-btn-color-border-default: var(--color-border-default);
      --split-btn-color-shadow-panel: var(--color-shadow-panel);
      --split-btn-color-text-primary: var(--color-text-primary);
      --split-btn-color-text-secondary: var(--color-text-secondary);
      --split-btn-color-select-primary: var(--color-bg-primary);
      --split-btn-color-select-secondary: var(--color-bg-input-hover);
    }

    .split-button-wrapper {
      display: inline-flex;
      width: 100%;
    }

    button {
      display: inline-block;
      position: relative;
      background-color: var(--split-btn-color-bg-primary);
      color: var(--split-btn-color-text-secondary);
      padding: 10px 16px;
      font-size: 14px;
      border: 1px solid var(--split-btn-color-border-primary);
      outline: none;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    button:hover {
      background-color: var(--split-btn-color-bg-secondary);
      border-color: var(--split-btn-color-border-secondary);
    }

    .main-btn {
      flex-grow: 1;
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
      border-top-left-radius: 6px;
      border-bottom-left-radius: 6px;
      border-right: none;
    }

    .main-btn::after {
      content: "";
      display: block;
      position: absolute;
      top: 50%;
      right: 0;
      transform-origin: center;
      transform: translate(0, -50%);
      height: 65%;
      width: 1px;
      background: rgba(255, 255, 255, .3);
    }

    .toggle-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 10px 6px;
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      border-top-right-radius: 6px;
      border-bottom-right-radius: 6px;
      border-left: none;
    }

    .toggle-btn-arrow {
      width: 14px;
      height: 14px;
      transition: rotate 0.2s;
    }

    .dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      margin: 1px 0 0 0;
      background-color: var(--split-btn-color-bg-default);
      border: 1px solid var(--split-btn-color-border-default);
      border-radius: 6px;
      box-shadow: 0 6px 16px var(--split-btn-color-shadow-panel);
      z-index: 100;
      display: flex;
      flex-direction: column;

      opacity: 0;
      visibility: hidden;
      transform: translateY(-5px);
      transition: all 0.2s ease;

      max-height: 250px;
      overflow-y: auto;
    }

    .dropdown.show {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    /* Style the slotted <option> elements */
    ::slotted(option) {
      display: block !important; /* Force block behavior */
      padding: 10px 15px;
      cursor: pointer;
      font-size: 0.8125rem;
      color: var(--split-btn-color-text-primary);
      transition: background-color 0.2s, color 0.2s;
      background-color: transparent;
      border: none;
    }

    ::slotted(option:hover) {
      background-color: var(--split-btn-color-select-secondary);
    }

    ::slotted(option[selected]) {
      background-color: var(--split-btn-color-select-primary);
      color: var(--split-btn-color-text-secondary);
      font-weight: 500;
    }
  </style>

  <div class="split-button-wrapper">
    <button class="main-btn" id="mainBtn">Download</button>
    <button class="toggle-btn" id="toggleBtn" aria-haspopup="true" aria-expanded="false" aria-label="Toggle options">
      <svg class="toggle-btn-arrow" viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
    <div class="dropdown" id="dropdown">
      <slot></slot>
    </div>
  </div>
`;

class SplitButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.mainBtn = this.shadowRoot.getElementById("mainBtn");
    this.toggleBtn = this.shadowRoot.getElementById("toggleBtn");
    this.dropdown = this.shadowRoot.getElementById("dropdown");
    this.slotElement = this.shadowRoot.querySelector("slot");

    // Bind methods
    this.toggleDropdown = this.toggleDropdown.bind(this);
    this.closeDropdown = this.closeDropdown.bind(this);
    this.handleOptionClick = this.handleOptionClick.bind(this);
    this.triggerAction = this.triggerAction.bind(this);
  }

  connectedCallback() {
    this.toggleBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      this.toggleDropdown();
    });

    this.mainBtn.addEventListener("click", this.triggerAction);

    // Event delegation for slotted options
    this.addEventListener("click", this.handleOptionClick);

    // Close when clicking outside
    document.addEventListener("click", this.closeDropdown);
  }

  disconnectedCallback() {
    document.removeEventListener("click", this.closeDropdown);
  }

  toggleDropdown() {
    const isShowing = this.dropdown.classList.contains("show");

    if (isShowing) return this.closeDropdown();

    this.dropdown.classList.add("show");
    this.toggleBtn.setAttribute("aria-expanded", "true");
  }

  closeDropdown(ev) {
    // Check if click was inside the component using composed path
    if (ev && ev.composedPath().includes(this)) return;

    this.dropdown.classList.remove("show");
    this.toggleBtn.setAttribute("aria-expanded", "false");
  }

  handleOptionClick(ev) {
    const option = ev.target.closest("option");

    if (!option) return;

    const allOptions = this.slotElement.assignedElements();
    allOptions.forEach(opt => opt.removeAttribute("selected"));

    option.setAttribute("selected", "");

    this.closeDropdown();
    this.triggerAction();
  }

  triggerAction() {
    const allOptions = this.slotElement.assignedElements();
    const selectedOption = allOptions.find((opt) => opt.hasAttribute("selected")) || allOptions[0];

    if (selectedOption) {
      const [action, format] = selectedOption.value.split(":");

      // Dispatch a custom event to the Light DOM
      this.dispatchEvent(new CustomEvent("execute", {
        detail: { action, format }
      }));
    }
  }
}

customElements.define("split-button", SplitButton);
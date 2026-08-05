(() => {
  "use strict";

  const root = document.documentElement;
  const storageKey = "ultimatebot-docs-theme";

  function preferredTheme() {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === "light" || stored === "dark") {
        return stored;
      }
    } catch {
      return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    }
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function applyTheme(theme) {
    root.dataset.theme = theme;
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      const nextTheme = theme === "dark" ? "light" : "dark";
      button.setAttribute("aria-label", `Use ${nextTheme} theme`);
      button.setAttribute("title", `Use ${nextTheme} theme`);
    });
  }

  function initializeTheme() {
    applyTheme(preferredTheme());
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const theme = root.dataset.theme === "dark" ? "light" : "dark";
        try {
          localStorage.setItem(storageKey, theme);
        } catch {
          root.dataset.theme = theme;
        }
        applyTheme(theme);
      });
    });
  }

  function initializeMenu() {
    const button = document.querySelector("[data-menu-toggle]");
    const navigation = document.querySelector("[data-header-nav]");
    if (!(button instanceof HTMLButtonElement) || !(navigation instanceof HTMLElement)) {
      return;
    }

    const close = () => {
      navigation.classList.remove("is-open");
      button.setAttribute("aria-expanded", "false");
    };

    button.addEventListener("click", () => {
      const open = navigation.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(open));
    });
    navigation.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        close();
      }
    });
    window.matchMedia("(min-width: 781px)").addEventListener("change", (event) => {
      if (event.matches) {
        close();
      }
    });
  }

  async function copyText(text) {
    if (!navigator.clipboard || !window.isSecureContext) {
      throw new Error("Clipboard access requires a secure browser context");
    }
    await navigator.clipboard.writeText(text);
  }

  function initializeCodeBlocks() {
    document.querySelectorAll("[data-code]").forEach((block) => {
      const code = block.querySelector("code");
      const header = block.querySelector(".code-header");
      if (!(code instanceof HTMLElement) || !(header instanceof HTMLElement)) {
        return;
      }

      const button = document.createElement("button");
      button.className = "copy-button";
      button.type = "button";
      button.textContent = "Copy";
      button.setAttribute("aria-label", "Copy code example");
      header.append(button);
      button.addEventListener("click", async () => {
        try {
          await copyText(code.textContent ?? "");
          button.textContent = "Copied";
          button.classList.add("is-copied");
          window.setTimeout(() => {
            button.textContent = "Copy";
            button.classList.remove("is-copied");
          }, 1800);
        } catch {
          button.textContent = "Unavailable";
        }
      });
    });
  }

  function initializeTabs() {
    document.querySelectorAll("[data-tabs]").forEach((tabs) => {
      const buttons = Array.from(tabs.querySelectorAll("[role='tab']"));
      const panels = Array.from(tabs.querySelectorAll("[role='tabpanel']"));
      const activate = (selected) => {
        buttons.forEach((button) => {
          const active = button === selected;
          button.setAttribute("aria-selected", String(active));
          button.tabIndex = active ? 0 : -1;
        });
        panels.forEach((panel) => {
          panel.hidden = panel.id !== selected.getAttribute("aria-controls");
        });
      };

      buttons.forEach((button, index) => {
        button.addEventListener("click", () => activate(button));
        button.addEventListener("keydown", (event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
            return;
          }
          event.preventDefault();
          const offset = event.key === "ArrowRight" ? 1 : -1;
          const next = buttons[(index + offset + buttons.length) % buttons.length];
          next.focus();
          activate(next);
        });
      });
    });
  }

  function typeUrl(type) {
    if (type.u) {
      return type.u;
    }
    return `${type.p.replaceAll(".", "/")}/${type.l}.html`;
  }

  function createReferenceCard(type) {
    const link = document.createElement("a");
    link.className = "reference-card";
    link.href = typeUrl(type);
    link.dataset.searchValue = `${type.l} ${type.p}`.toLowerCase();

    const name = document.createElement("span");
    name.className = "reference-name";
    name.textContent = type.l;

    const packageName = document.createElement("span");
    packageName.className = "reference-package";
    packageName.textContent = type.p || "Index";

    link.append(name, packageName);
    return link;
  }

  function parseTypeIndex(source) {
    const match = source.match(/typeSearchIndex\s*=\s*(\[[\s\S]*?\]);/);
    if (!match) {
      throw new Error("Javadoc type index is unavailable");
    }
    return JSON.parse(match[1]).filter((type) => type.p && type.l);
  }

  async function initializeReferenceExplorer() {
    const explorer = document.querySelector("[data-reference-index]");
    if (!(explorer instanceof HTMLElement)) {
      return;
    }

    const grid = explorer.querySelector("[data-reference-grid]");
    const input = explorer.querySelector("[data-reference-search]");
    const count = explorer.querySelector("[data-reference-count]");
    if (!(grid instanceof HTMLElement) || !(input instanceof HTMLInputElement)) {
      return;
    }

    try {
      const response = await fetch(explorer.dataset.referenceIndex ?? "type-search-index.js");
      if (!response.ok) {
        throw new Error(`Reference index returned ${response.status}`);
      }
      const types = parseTypeIndex(await response.text());
      const cards = types.map(createReferenceCard);
      grid.replaceChildren(...cards);

      const filter = () => {
        const query = input.value.trim().toLowerCase();
        let visible = 0;
        cards.forEach((card) => {
          const matches = !query || card.dataset.searchValue.includes(query);
          card.hidden = !matches;
          visible += matches ? 1 : 0;
        });
        if (count) {
          count.textContent = `${visible} of ${cards.length} public types`;
        }
        const existingEmpty = grid.querySelector(".reference-empty");
        if (visible === 0 && !existingEmpty) {
          const empty = document.createElement("div");
          empty.className = "reference-empty";
          empty.textContent = "No public type matches this search.";
          grid.append(empty);
        } else if (visible > 0 && existingEmpty) {
          existingEmpty.remove();
        }
      };

      input.addEventListener("input", filter);
      document.addEventListener("keydown", (event) => {
        const target = event.target;
        const typing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;
        if (event.key === "/" && !typing) {
          event.preventDefault();
          input.focus();
        }
      });
      filter();
    } catch {
      grid.innerHTML = '<div class="reference-empty">Open the complete Javadocs to browse the public reference.</div>';
      if (count) {
        count.textContent = "Reference index unavailable in this preview";
      }
    }
  }

  function initializeSectionNavigation() {
    const links = Array.from(document.querySelectorAll("[data-section-nav] a"));
    if (!links.length || !("IntersectionObserver" in window)) {
      return;
    }
    const sections = links
      .map((link) => document.querySelector(link.getAttribute("href") ?? ""))
      .filter((section) => section instanceof HTMLElement);
    const byId = new Map(links.map((link) => [link.hash.slice(1), link]));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0];
        if (!visible) {
          return;
        }
        links.forEach((link) => link.classList.remove("is-active"));
        byId.get(visible.target.id)?.classList.add("is-active");
      },
      { rootMargin: "-20% 0px -68%", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
  }

  function initializeMetadata() {
    const year = String(new Date().getFullYear());
    document.querySelectorAll("[data-current-year]").forEach((node) => {
      node.textContent = year;
    });
  }

  initializeTheme();
  initializeMenu();
  initializeCodeBlocks();
  initializeTabs();
  initializeReferenceExplorer();
  initializeSectionNavigation();
  initializeMetadata();
})();

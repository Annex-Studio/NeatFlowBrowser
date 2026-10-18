/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { Services } from "resource://gre/modules/Services.jsm";
import { XPCOMUtils } from "resource://gre/modules/XPCOMUtils.jsm";

XPCOMUtils.defineLazyModuleGetters(this, {
  PlacesUIUtils: "resource:///modules/PlacesUIUtils.jsm",
  Downloads: "resource://gre/modules/Downloads.jsm",
});

const PREF_SIDEBAR_ENABLED = "neatflow.sidebar.enabled";
const PREF_SIDEBAR_VISIBLE = "neatflow.sidebar.visible";

/**
 * NeatFlowSidebar - Manages the optional collapsible sidebar
 */
export class NeatFlowSidebar {
  constructor() {
    this.sidebar = null;
    this.toggleButton = null;
    this.closeButton = null;
    this.isEnabled = false;
    this.isVisible = false;
    
    this.init();
  }

  async init() {
    // Check if sidebar is enabled
    this.isEnabled = Services.prefs.getBoolPref(PREF_SIDEBAR_ENABLED, false);
    this.isVisible = Services.prefs.getBoolPref(PREF_SIDEBAR_VISIBLE, false);
    
    if (!this.isEnabled) {
      return;
    }
    
    // Load the sidebar XHTML
    await this.loadSidebar();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Update UI state
    this.updateSidebarState();
  }

  async loadSidebar() {
    try {
      const sidebarURL = "chrome://browser/content/sidebar/neatflow-sidebar.xhtml";
      const response = await fetch(sidebarURL);
      const html = await response.text();
      
      // Create a container for the sidebar
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      
      // Extract sidebar elements
      this.sidebar = doc.getElementById("neatflow-sidebar");
      this.toggleButton = doc.getElementById("neatflow-sidebar-toggle");
      this.closeButton = doc.getElementById("neatflow-sidebar-close");
      
      // Append to document
      document.body.appendChild(this.sidebar);
      document.body.appendChild(this.toggleButton);
      
      // Load content
      await this.loadBookmarks();
      await this.loadHistory();
      await this.loadDownloads();
      
    } catch (error) {
      console.error("Failed to load NeatFlow sidebar:", error);
    }
  }

  setupEventListeners() {
    if (!this.toggleButton || !this.closeButton || !this.sidebar) {
      return;
    }
    
    // Toggle button click
    this.toggleButton.addEventListener("click", () => this.toggleSidebar());
    
    // Close button click
    this.closeButton.addEventListener("click", () => this.hideSidebar());
    
    // Escape key to close sidebar
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && this.isVisible) {
        this.hideSidebar();
      }
    });
    
    // Preference change observer
    Services.prefs.addObserver(PREF_SIDEBAR_ENABLED, this);
    Services.prefs.addObserver(PREF_SIDEBAR_VISIBLE, this);
  }

  observe(subject, topic, data) {
    if (topic === "nsPref:changed") {
      if (data === PREF_SIDEBAR_ENABLED) {
        this.isEnabled = Services.prefs.getBoolPref(PREF_SIDEBAR_ENABLED, false);
        this.updateSidebarState();
      } else if (data === PREF_SIDEBAR_VISIBLE) {
        this.isVisible = Services.prefs.getBoolPref(PREF_SIDEBAR_VISIBLE, false);
        this.updateSidebarState();
      }
    }
  }

  toggleSidebar() {
    if (this.isVisible) {
      this.hideSidebar();
    } else {
      this.showSidebar();
    }
  }

  showSidebar() {
    if (!this.sidebar || !this.toggleButton) {
      return;
    }
    
    this.sidebar.hidden = false;
    this.toggleButton.setAttribute("open", "true");
    this.toggleButton.setAttribute("aria-expanded", "true");
    this.isVisible = true;
    
    // Save preference
    Services.prefs.setBoolPref(PREF_SIDEBAR_VISIBLE, true);
    
    // Focus first item for keyboard navigation
    const firstItem = this.sidebar.querySelector(".neatflow-sidebar-item");
    if (firstItem) {
      firstItem.focus();
    }
  }

  hideSidebar() {
    if (!this.sidebar || !this.toggleButton) {
      return;
    }
    
    this.sidebar.hidden = true;
    this.toggleButton.removeAttribute("open");
    this.toggleButton.setAttribute("aria-expanded", "false");
    this.isVisible = false;
    
    // Save preference
    Services.prefs.setBoolPref(PREF_SIDEBAR_VISIBLE, false);
    
    // Return focus to toggle button
    this.toggleButton.focus();
  }

  updateSidebarState() {
    if (!this.sidebar || !this.toggleButton) {
      return;
    }
    
    // Show/hide toggle button based on enabled state
    this.toggleButton.style.display = this.isEnabled ? "flex" : "none";
    
    // Show/hide sidebar based on visible state
    if (this.isVisible && this.isEnabled) {
      this.showSidebar();
    } else {
      this.hideSidebar();
    }
  }

  async loadBookmarks() {
    if (!this.sidebar) {
      return;
    }
    
    const bookmarksList = this.sidebar.querySelector("#neatflow-sidebar-bookmarks-list");
    if (!bookmarksList) {
      return;
    }
    
    try {
      const bookmarks = await PlacesUIUtils.getBookmarks();
      // Simple implementation - show top bookmarks
      bookmarksList.innerHTML = bookmarks.slice(0, 10).map(bookmark => `
        <a href="${bookmark.url}" class="neatflow-sidebar-item">
          <svg class="neatflow-sidebar-item-icon" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" fill="currentColor"/>
          </svg>
          <span class="neatflow-sidebar-item-label">${bookmark.title}</span>
        </a>
      `).join("");
    } catch (error) {
      console.error("Failed to load bookmarks:", error);
      bookmarksList.innerHTML = "<p>Failed to load bookmarks</p>";
    }
  }

  async loadHistory() {
    if (!this.sidebar) {
      return;
    }
    
    const historyList = this.sidebar.querySelector("#neatflow-sidebar-history-list");
    if (!historyList) {
      return;
    }
    
    try {
      const history = await PlacesUIUtils.getHistory();
      // Simple implementation - show recent history
      historyList.innerHTML = history.slice(0, 10).map(item => `
        <a href="${item.url}" class="neatflow-sidebar-item">
          <svg class="neatflow-sidebar-item-icon" viewBox="0 0 24 24">
            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" fill="currentColor"/>
          </svg>
          <span class="neatflow-sidebar-item-label">${item.title}</span>
        </a>
      `).join("");
    } catch (error) {
      console.error("Failed to load history:", error);
      historyList.innerHTML = "<p>Failed to load history</p>";
    }
  }

  async loadDownloads() {
    if (!this.sidebar) {
      return;
    }
    
    const downloadsList = this.sidebar.querySelector("#neatflow-sidebar-downloads-list");
    if (!downloadsList) {
      return;
    }
    
    try {
      const downloads = await Downloads.getSummary();
      // Simple implementation - show recent downloads
      downloadsList.innerHTML = downloads.slice(0, 10).map(download => `
        <a href="${download.url}" class="neatflow-sidebar-item">
          <svg class="neatflow-sidebar-item-icon" viewBox="0 0 24 24">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
          </svg>
          <span class="neatflow-sidebar-item-label">${download.name}</span>
        </a>
      `).join("");
    } catch (error) {
      console.error("Failed to load downloads:", error);
      downloadsList.innerHTML = "<p>Failed to load downloads</p>";
    }
  }

  destroy() {
    // Clean up event listeners
    if (this.toggleButton) {
      this.toggleButton.removeEventListener("click", this.toggleSidebar);
    }
    
    if (this.closeButton) {
      this.closeButton.removeEventListener("click", this.hideSidebar);
    }
    
    // Remove preference observers
    Services.prefs.removeObserver(PREF_SIDEBAR_ENABLED, this);
    Services.prefs.removeObserver(PREF_SIDEBAR_VISIBLE, this);
    
    // Remove DOM elements
    if (this.sidebar) {
      this.sidebar.remove();
    }
    
    if (this.toggleButton) {
      this.toggleButton.remove();
    }
  }
}

// Initialize sidebar when DOM is ready
let sidebarInstance = null;

function initSidebar() {
  if (sidebarInstance) {
    return;
  }
  
  // Only initialize if NeatFlow is enabled
  if (Services.prefs.getBoolPref("browser.neatflow.enabled", false)) {
    sidebarInstance = new NeatFlowSidebar();
  }
}

function destroySidebar() {
  if (sidebarInstance) {
    sidebarInstance.destroy();
    sidebarInstance = null;
  }
}

// Export for testing
export { NeatFlowSidebar, initSidebar, destroySidebar };

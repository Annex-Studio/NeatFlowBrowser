/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

import { Services } from "resource://gre/modules/Services.jsm";

// Check if NeatFlow is enabled
if (!Services.prefs.getBoolPref("browser.neatflow.enabled", false)) {
  // Redirect to Firefox privacy page if NeatFlow is disabled
  window.location.href = "about:preferences#privacy";
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", async () => {
  // Check tracking protection status
  await checkTrackingProtection();
  
  // Check uBlock Origin status
  await checkUBlockOrigin();
  
  // Set up install button
  setupInstallButton();
});

async function checkTrackingProtection() {
  try {
    const statusElement = document.getElementById("tracking-protection-text");
    const indicator = document.querySelector("#tracking-protection .neatflow-privacy-status-indicator");
    
    if (!statusElement || !indicator) {
      return;
    }
    
    // Check if tracking protection is enabled
    const isEnabled = Services.prefs.getIntPref("privacy.trackingprotection.enabled", 0) > 0;
    const level = Services.prefs.getIntPref("privacy.trackingprotection.pbmode.enabled", 0) ? 
                  "Strict" : Services.prefs.getIntPref("privacy.trackingprotection.enabled", 0) === 2 ? 
                  "Strict" : "Standard";
    
    if (isEnabled) {
      statusElement.textContent = `Enabled (${level} mode)`;
      indicator.classList.add("enabled");
    } else {
      statusElement.textContent = "Disabled";
      indicator.classList.add("disabled");
    }
  } catch (error) {
    console.error("Failed to check tracking protection:", error);
  }
}

async function checkUBlockOrigin() {
  try {
    const statusElement = document.getElementById("ublock-text");
    const indicator = document.querySelector("#content-blocking .neatflow-privacy-status-indicator");
    const installButton = document.getElementById("install-ublock");
    
    if (!statusElement || !indicator) {
      return;
    }
    
    // Check if uBlock Origin is installed
    const addon = await AddonManager.getAddonByID("uBlock0@raymondhill.net");
    
    if (addon) {
      statusElement.textContent = "uBlock Origin: Installed and active";
      indicator.classList.add("installed");
      if (installButton) {
        installButton.style.display = "none";
      }
    } else {
      statusElement.textContent = "uBlock Origin: Not installed";
      indicator.classList.add("disabled");
      if (installButton) {
        installButton.style.display = "inline-flex";
      }
    }
  } catch (error) {
    console.error("Failed to check uBlock Origin:", error);
    // Fallback - show install button
    const installButton = document.getElementById("install-ublock");
    if (installButton) {
      installButton.style.display = "inline-flex";
    }
  }
}

function setupInstallButton() {
  const installButton = document.getElementById("install-ublock");
  
  if (!installButton) {
    return;
  }
  
  installButton.addEventListener("click", async () => {
    try {
      // Open uBlock Origin on AMO
      window.open("https://addons.mozilla.org/firefox/addon/ublock-origin/", "_blank");
      
      // Update button text
      installButton.innerHTML = `
        <span>Installing...</span>
        <svg class="neatflow-privacy-button-icon" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
        </svg>
      `;
      
      // Check every second if installed
      const checkInterval = setInterval(async () => {
        const addon = await AddonManager.getAddonByID("uBlock0@raymondhill.net");
        if (addon) {
          clearInterval(checkInterval);
          installButton.style.display = "none";
          const statusElement = document.getElementById("ublock-text");
          const indicator = document.querySelector("#content-blocking .neatflow-privacy-status-indicator");
          if (statusElement) {
            statusElement.textContent = "uBlock Origin: Installed and active";
          }
          if (indicator) {
            indicator.classList.remove("disabled");
            indicator.classList.add("installed");
          }
        }
      }, 1000);
      
      // Clear interval after 30 seconds
      setTimeout(() => clearInterval(checkInterval), 30000);
      
    } catch (error) {
      console.error("Failed to install uBlock Origin:", error);
      installButton.innerHTML = `
        <span>Install uBlock Origin</span>
        <svg class="neatflow-privacy-button-icon" viewBox="0 0 24 24">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" fill="currentColor"/>
        </svg>
      `;
    }
  });
}

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// NeatFlow Browser specific preferences

// Theme settings
// 0 = System (default), 1 = Light, 2 = Dark
pref("neatflow.theme.mode", 0);

// Sidebar visibility - hidden by default
pref("neatflow.sidebar.enabled", false);
pref("neatflow.sidebar.visible", false);

// New Tab page settings
pref("neatflow.newtab.showLogo", true);
pref("neatflow.newtab.showSearch", true);

// Privacy settings - enable tracking protection by default
pref("neatflow.privacy.trackingProtection.enabled", true);
pref("neatflow.privacy.ublockOrigin.enabled", true);

// Disable sponsored content and ads
pref("neatflow.newtab.disableSponsoredContent", true);
pref("neatflow.newtab.disableAds", true);

// Brand identity
pref("neatflow.brand.showWordmark", true);
pref("neatflow.brand.accentColor", "#5b3f86");

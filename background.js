const TITLE_HIDE = browser.i18n.getMessage("hideButton");
const TITLE_SHOW = browser.i18n.getMessage("showButton");
let emergencyTabId = null;

const setupAddon = ({ reason }) => {
  if (reason === 'install') {
    browser.storage.sync.set({
      is_empty_tab: true,
      new_tab_website: "https://www.mozilla.org",
      unload_tabs: false,
      show_context_menu: true
    });
  }
}

// Create menus with parent initially hidden
browser.menus.create({
  id: "hide-tabs",
  title: browser.i18n.getMessage("extensionName"),
  contexts: ["tab"],
  visible: false
});

browser.menus.create({
  id: "hide-this-tab",
  parentId: "hide-tabs",
  title: browser.i18n.getMessage("hideThisTab"),
  contexts: ["tab"],
});

browser.menus.create({
  id: "hide-other-tabs",
  parentId: "hide-tabs",
  title: browser.i18n.getMessage("hideOtherTabs"),
  contexts: ["tab"],
});

browser.menus.create({
  id: "hide-all-tabs",
  parentId: "hide-tabs",
  title: browser.i18n.getMessage("hideAllTabs"),
  contexts: ["tab"],
});

// Add separator
browser.menus.create({
  parentId: "hide-tabs",
  type: "separator",
  contexts: ["tab"],
});

// Add "Options" item
browser.menus.create({
  id: "options",
  parentId: "hide-tabs",
  title: browser.i18n.getMessage("optionsMenuItem"),
  contexts: ["tab"],
});

const hideTabs = async (tabIds = null) => {
  browser.browserAction.setTitle({ title: TITLE_SHOW });

  let tabs;
  if (tabIds) {
    tabs = await Promise.all(tabIds.map(id => browser.tabs.get(id)));
  } else {
    tabs = await browser.tabs.query({ currentWindow: true, pinned: false });
  }

  const options = await browser.storage.sync.get(["is_empty_tab", "new_tab_website", "unload_tabs", "show_context_menu"]);
  
  const tabOptions = options.is_empty_tab ? {} : { url: options.new_tab_website };
  browser.tabs.create(tabOptions).then(tab => {
    emergencyTabId = tab.id;
  });

  for (let tab of tabs) {
    browser.tabs.hide(tab.id);
    if (options.unload_tabs) {
      browser.tabs.discard(tab.id);
    }
  }

  // Count all hidden tabs in the current window
  const hiddenTabs = await browser.tabs.query({ currentWindow: true, hidden: true });
  browser.browserAction.setBadgeText({
    text: hiddenTabs.length.toString()
  });

  browser.browserAction.setBadgeBackgroundColor({ color: "white" });
  browser.browserAction.setBadgeTextColor({ color: "black" });
};

const showTabs = async (tabIds = null) => {
  browser.browserAction.setBadgeText({ text: "" });
  browser.browserAction.setTitle({ title: TITLE_HIDE });

  let tabs;
  if (tabIds) {
    tabs = await Promise.all(tabIds.map(id => browser.tabs.get(id)));
  } else {
    tabs = await browser.tabs.query({ currentWindow: true });
  }

  for (let tab of tabs) {
    browser.tabs.show(tab.id);
  }

  killEmergencyTab();
};

browser.menus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "hide-this-tab") {
    hideTabs([tab.id]);
  } else if (info.menuItemId === "hide-other-tabs") {
    browser.tabs.query({ currentWindow: true, pinned: false }).then(tabs => {
      const otherTabIds = tabs.filter(t => t.id !== tab.id).map(t => t.id);
      hideTabs(otherTabIds);
    });
  } else if (info.menuItemId === "hide-all-tabs") {
    hideTabs();
  } else if (info.menuItemId === "options") {
    browser.runtime.openOptionsPage();
  }
});

browser.runtime.onInstalled.addListener(setupAddon)

const toggleTabs = () => {
  browser.browserAction.getTitle({}).then(title => {
    if (title === TITLE_HIDE) {
      hideTabs();
    } else {
      showTabs();
    }
  }, error => {
    console.log(error);
  });
};

const killEmergencyTab = () => {
  if (emergencyTabId) {
    browser.tabs.get(emergencyTabId).then(tab => {
      browser.tabs.remove(tab.id)
    })
  }
}

function handleMessage(message, sender, sendResponse) {
  if (message.toUpperCase() === "HIDE_TABS") {
    toggleTabs();
  }

  sendResponse({ response: "Message received" });
}

browser.browserAction.onClicked.addListener(toggleTabs);
browser.runtime.onMessageExternal.addListener(handleMessage);

// Function to update menu visibility
async function updateTabMenuVisibility() {
  const { show_context_menu } = await browser.storage.sync.get("show_context_menu");
  browser.menus.update("hide-tabs", { visible: !!show_context_menu });
}

// Initial update on startup
updateTabMenuVisibility();

// Listen for changes to the setting and update visibility
browser.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.show_context_menu) {
    updateTabMenuVisibility();
  }
});

browser.commands.onCommand.addListener(async command => {
  if (command === "unload-all-tabs") {
    // Toggle: if any tab is discarded, reload all; else, discard all
    const tabs = await browser.tabs.query({ currentWindow: true, pinned: false });
    const discardedTabs = tabs.filter(tab => tab.discarded);
    if (discardedTabs.length > 0) {
      tabs.forEach(tab => browser.tabs.reload(tab.id));
    } else {
      tabs.forEach(tab => browser.tabs.discard(tab.id));
    }
  } else if (command === "hide-and-unload-tabs") {
    // Toggle: if any tab is hidden or discarded, show and reload all; else, hide and discard all
    const tabs = await browser.tabs.query({ currentWindow: true, pinned: false });
    const hiddenTabs = tabs.filter(tab => tab.hidden);
    const discardedTabs = tabs.filter(tab => tab.discarded);
    if (hiddenTabs.length > 0 || discardedTabs.length > 0) {
      showTabs();
      tabs.forEach(tab => browser.tabs.reload(tab.id));
    } else {
      hideTabs();
      tabs.forEach(tab => browser.tabs.discard(tab.id));
    }
  }
});

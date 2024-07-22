const TITLE_HIDE = browser.i18n.getMessage("hideButton");
const TITLE_SHOW = browser.i18n.getMessage("showButton");
let emergencyTabId = null;

const setupAddon = ({ reason }) => {
  if (reason === 'install') {
    browser.storage.sync.set({
      is_empty_tab: true,
      new_tab_website: "https://www.mozilla.org"
    });
  }
}

browser.runtime.onInstalled.addListener(setupAddon)

const toggleTabs = () => {
  browser.browserAction.getTitle({}).then(title => {
    if (title === TITLE_HIDE) {
      browser.browserAction.setTitle({ title: TITLE_SHOW });

      browser.tabs.query({ currentWindow: true, pinned: false }).then((tabs) => {
        let optionsPromise = browser.storage.sync.get(["is_empty_tab", "new_tab_website"]).then(options => {
          const tabOptions = options.is_empty_tab ? {} : { url: options.new_tab_website }
          browser.tabs.create(tabOptions).then(tab => {
            emergencyTabId = tab.id
          });
          
          for (let tab of tabs) {
            browser.tabs.hide(tab.id);
          }

          browser.browserAction.setBadgeText({
            text: tabs.length.toString()
          })

          browser.browserAction.setBadgeBackgroundColor({ color: "white" })

          browser.browserAction.setBadgeTextColor({ color: "black" })
        })
      })
    } else {
      browser.browserAction.setBadgeText({ text: "" });
      browser.browserAction.setTitle({ title: TITLE_HIDE });

      browser.tabs.query({ currentWindow: true }).then((tabs) => {
        for (let tab of tabs) {
          browser.tabs.show(tab.id);
        }
      })

      killEmergencyTab();
    }
  }, error => {
    console.log(error)
  });

}

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

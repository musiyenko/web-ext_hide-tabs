const TITLE_HIDE = browser.i18n.getMessage("hideButton");
const TITLE_SHOW = browser.i18n.getMessage("showButton");

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
          browser.tabs.create(tabOptions);
          for (let tab of tabs) {
            browser.tabs.hide(tab.id);
          }

          browser.browserAction.setBadgeText({
            text: tabs.length.toString()
          })

          browser.browserAction.setBadgeBackgroundColor({ color: "white" })

          browser.browserAction.setBadgeTextColor({ color: "black" })
        })

        killEmergencyTabs();
      })
    } else {
      browser.browserAction.setBadgeText({ text: "" });
      browser.browserAction.setTitle({ title: TITLE_HIDE });

      browser.tabs.query({ currentWindow: true }).then((tabs) => {
        for (let tab of tabs) {
          browser.tabs.show(tab.id);
        }
      })

      killEmergencyTabs();
    }
  }, error => {
    console.log(error)
  });

}

const killEmergencyTabs = () => {
  browser.tabs.query({ url: "about:newtab" }).then(tabs => {
    for (let tab of tabs) {
      browser.tabs.remove(tab.id)
    }
  })
}

browser.browserAction.onClicked.addListener(toggleTabs);

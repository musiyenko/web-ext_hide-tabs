const TITLE_HIDE = browser.i18n.getMessage("hideButton");
const TITLE_SHOW = browser.i18n.getMessage("showButton");

const toggleTabs = () => {

  browser.browserAction.getTitle({}).then(title =>  {
    if (title === TITLE_HIDE) {
      browser.browserAction.setTitle({title: TITLE_SHOW});
      
      browser.tabs.query({currentWindow: true, pinned: false}).then((tabs) => {
        browser.tabs.create({});
        
        for (let tab of tabs) {
          browser.tabs.hide(tab.id);
        }

        browser.browserAction.setBadgeText({
          text: tabs.length.toString()
        })

        browser.browserAction.setBadgeBackgroundColor({color: "white"})

        browser.browserAction.setBadgeTextColor({color: "black"})
      })
      
      killBlankTabs();
    } else {
      browser.browserAction.setBadgeText({text: ""});
      browser.browserAction.setTitle({title: TITLE_HIDE});

      browser.tabs.query({currentWindow: true}).then((tabs) => {
        for (let tab of tabs) {
          browser.tabs.show(tab.id);
        }
      })

      killBlankTabs();
    }
  }, error => {
    console.log(error)
  });
  
}

const killBlankTabs = () => {
  browser.tabs.query({url: "about:newtab"}).then(tabs => {
    for (let tab of tabs) {
      browser.tabs.remove(tab.id)
    }
  })
}

browser.browserAction.onClicked.addListener(toggleTabs);

const isEmptyTabRef = document.querySelector("#is_empty_tab")
const websiteRef = document.querySelector("#website")
const unloadTabs = document.querySelector("#unload_tabs")
const showContextMenu = document.querySelector("#show_context_menu")

const saveOptions = e => {
    e.preventDefault();

    const pattern = /^((http|https):\/\/)/;
    let websiteUrl = websiteRef.value

    if (!pattern.test(websiteUrl)) {
        websiteUrl = "https://" + websiteUrl;
    }

    browser.storage.sync.set({
        is_empty_tab: isEmptyTabRef.checked,
        unload_tabs: unloadTabs.checked,
        show_context_menu: showContextMenu.checked,
        new_tab_website: websiteUrl
    });
}

const restoreOptions = () => {
    const onError = error => {
        console.error(`Error: ${error}`);
    }

    const setOptions = result => {
        websiteRef.value = result.new_tab_website
        isEmptyTabRef.checked = result.is_empty_tab
        showContextMenu.checked = result.show_context_menu
        unloadTabs.checked = result.unload_tabs
    }

    let optionsPromise = browser.storage.sync.get(["is_empty_tab", "new_tab_website", "unload_tabs", "show_context_menu"])

    optionsPromise.then(setOptions, onError)
}

const localizeOptionsStrings = () => {
    const TITLE_OPTION_OPEN_EMPTY_TAB = browser.i18n.getMessage("optionOpenEmptyTab")
    const TITLE_OPTION_UNLOAD_TABS = browser.i18n.getMessage("optionUnloadTabs")
    const TITLE_OPTION_SHOW_CONTEXT_MENU = browser.i18n.getMessage("optionShowContextMenu")
    const TITLE_OPTION_WEBSITE = browser.i18n.getMessage("optionWebsite")
    const TITLE_OPTION_SAVE_BUTTON = browser.i18n.getMessage("optionSaveButton")
    const TITLE_OPEN_SHORTCUT_SETTINGS = browser.i18n.getMessage("openShortcutSettings");

    document.querySelector('#label_is_empty_tab').textContent = TITLE_OPTION_OPEN_EMPTY_TAB
    document.querySelector('#label_unload_tabs').textContent = TITLE_OPTION_UNLOAD_TABS
    document.querySelector('#label_show_context_menu').textContent = TITLE_OPTION_SHOW_CONTEXT_MENU
    document.querySelector('#label_website').textContent = TITLE_OPTION_WEBSITE
    document.querySelector('#label_save_button').textContent = TITLE_OPTION_SAVE_BUTTON
    document.getElementById('open_shortcut_settings').textContent = TITLE_OPEN_SHORTCUT_SETTINGS;
}

function isFirefox137OrNewer() {
    const ffVersion = navigator.userAgent.match(/Firefox\/(\d+)/);
    return ffVersion ? parseInt(ffVersion[1], 10) >= 137 : false;
}

document.querySelector("form").addEventListener("submit", saveOptions);
document.addEventListener("DOMContentLoaded", () => {
    restoreOptions();
    localizeOptionsStrings();

    // Hide shortcut button if Firefox < 137
    if (!isFirefox137OrNewer()) {
        document.getElementById('open_shortcut_settings').style.display = 'none';
    }
});

document.getElementById('open_shortcut_settings').addEventListener('click', function () {
    if (isFirefox137OrNewer() && browser.commands && typeof browser.commands.openShortcutSettings === "function") {
        browser.commands.openShortcutSettings();
    }
});

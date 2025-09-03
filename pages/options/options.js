const isEmptyTabRef = document.querySelector("#is_empty_tab")
const websiteRef = document.querySelector("#website")
const unloadTabs = document.querySelector("#unload_tabs")

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
        unloadTabs.checked = result.unload_tabs
    }

    let optionsPromise = browser.storage.sync.get(["is_empty_tab", "new_tab_website", "unload_tabs"])

    optionsPromise.then(setOptions, onError)
}

const localizeOptionsStrings = () => {
    const TITLE_OPTION_OPEN_EMPTY_TAB = browser.i18n.getMessage("optionOpenEmptyTab")
    const TITLE_OPTION_UNLOAD_TABS = browser.i18n.getMessage("optionUnloadTabs")
    const TITLE_OPTION_WEBSITE = browser.i18n.getMessage("optionWebsite")
    const TITLE_OPTION_SAVE_BUTTON = browser.i18n.getMessage("optionSaveButton")

    document.querySelector('#label_is_empty_tab').textContent = TITLE_OPTION_OPEN_EMPTY_TAB
    document.querySelector('#label_unload_tabs').textContent = TITLE_OPTION_UNLOAD_TABS
    document.querySelector('#label_website').textContent = TITLE_OPTION_WEBSITE
    document.querySelector('#label_save_button').textContent = TITLE_OPTION_SAVE_BUTTON
}

document.querySelector("form").addEventListener("submit", saveOptions);
document.addEventListener("DOMContentLoaded", () => {
    restoreOptions()
    localizeOptionsStrings()
});

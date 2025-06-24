import thFactory from "./thFactory.js";

import waitForElements from "./waitForElements.js";

function Tabs() {
  const th = thFactory("Tabs");
  const options = ["#headers-tab", "#dictionary-tab"];
  const defaultTab = "#headers-tab";
  const activateTab = (this.activateTab = function (tabId) {
    if (typeof tabId !== "string") {
      tabId = defaultTab;
    }
    if (!options.includes(tabId)) {
      throw th(`Invalid tab ID: ${tabId}`);
    }
    options.forEach((id) => {
      document.querySelector(id).classList.remove("active");
      document.querySelector(`[data-tab="${id}"]`).classList.remove("active");
    });
    document.querySelector(tabId).classList.add("active");
    document.querySelector(`[data-tab="${tabId}"]`).classList.add("active");
  });
  (async function () {
    await waitForElements(options);
    debugger;
    activateTab();
  })();
  document.addEventListener("click", (e) => {
    if (
      options.some((selector) => {
        return e.target.matches(`[data-tab="${selector}"]`);
      })
    ) {
      activateTab(e.target.getAttribute("data-tab"));
    }
  });
}

const tabs = new Tabs();

export default tabs;

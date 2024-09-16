// ==UserScript==
// @name         Gitlab Clone
// @namespace    http://tampermonkey.net/
// @downloadURL  https://raw.githubusercontent.com/arog-lahcim/gitlab-clone-extension/main/tempermonkey.js
// @updateURL    https://raw.githubusercontent.com/arog-lahcim/gitlab-clone-extension/main/tempermonkey.js
// @version      2024-09-16
// @description  Build git clone script for all nested repositories.
// @author       arog-lahcim
// @match        https://gitlab.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=gitlab.com
// @grant        none
// @run-at       context-menu
// ==/UserScript==

(async function () {
  "use strict";

  const url = `${window.location.href.replace(
    ".com",
    ".com/groups"
  )}/-/children.json`;

  const toStr = (tree) => tree.join("\r\n");

  const getDestination = (child) => {
    return child.relative_path;
  };

  const buildTree = async (child) => {
    if (child.type === "project") {
      return child;
    } else if (child.type === "group") {
      const subs = await fetch(`${url}?parent_id=${child.id}`).then((x) =>
        x.json()
      );
      return (await Promise.all(subs.map(buildTree))).flat();
    }
    return null;
  };

  const convertIntoScripts = (listOfChildren) => {
    return listOfChildren.map((child) => {
      const destination = getDestination(child);
      return `git clone git@gitlab.com:${child.relative_path} ${destination}`;
    });
  };

  const main = async () => {
    const subs = await fetch(url).then((x) => x.json());
    console.log(subs);
    const tree = await Promise.all(subs.map(buildTree));
    const list = tree.flat();

    const script = toStr(convertIntoScripts(list));

    const resultBox = document.createElement("div");
    resultBox.classList.add("gitlab-clone-result-script");
    resultBox.id = "gitlab-clone-result-script";
    resultBox.innerHTML = `<code style="white-space: pre-wrap;">${script}</code><div class="copy-result"></div>
        <style>
            .gitlab-clone-result-script {
                position: absolute;
                top: 0;
                display: block;
                z-index: 9999;
                padding: 1em;
                height: 100%;
                max-height: 100%;
                overflow: auto;
                backdrop-filter: blur(10px);
                width: 100%;
            }
            .gitlab-clone-result-script>code{
                white-space: pre-wrap;
                display: block;
            }
            .gitlab-clone-result-script>.copy-result{
                text-align: center;
            }
        </style>`;

    document.body.append(resultBox);
    const code = document.querySelector("#gitlab-clone-result-script>code");
    const range = document.createRange();
    range.setStartBefore(code);
    range.setEndAfter(code);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    const coppied = document.execCommand("copy");
    if (coppied) {
      document.querySelector(
        "#gitlab-clone-result-script>.copy-result"
      ).innerHTML = "Coppied to clipboard!";
    }
  };

  await main();
})();

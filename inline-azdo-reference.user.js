// ==UserScript==
// @name         Inline AzDo Issue
// @namespace    https://dot.net/
// @version      1.0
// @description  Inline AzDO titles and descriptions for linked GitHub issues
// @author       Chad Nedzlek
// @match        https://github.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=github.com
// @grant        GM_xmlhttpRequest
// @connect      api.github.com
// @connect      dev.azure.com
// ==/UserScript==

(function() {
    'use strict';

    function handleUpdate(mutationList) {
        stopObservation();
        if (window.location.href.match(/^https:\/\/github\.com\/dotnet\/(arcade|dnceng|arcade-services)\/issues\/(\d+)$/)) {
            handleSingleIssue();
        } else if (window.location.href.match(/^https:\/\/github\.com\/dotnet\/(arcade|dnceng|arcade-services)\/issues($|\?)/)) {
            updateIssueList();
        } else if (window.location.href.match(/^https:\/\/github\.com\/orgs\/dotnet\/projects\/(86|276)\/views/)) {
            updateProjectBoard();
        } else if (window.location.href.match(/^https:\/\/github\.com\/dotnet\/(arcade|dnceng|arcade-services)\/milestone\/(\d+)$/)) {
            updateMilestoneView();
        }
        startObservation();
    }

    function handleSingleIssue() {
        const descElement = document.getElementsByClassName("comment-body")[0];
        if (!descElement || descElement.chadnedzAzdoRan) {
            return;
        }
        descElement.chadnedzAzdoRan = true;

        function getId() {
            const links = descElement.getElementsByTagName("a");
            for(const l of links) {
                const m = l.href.match(/https:\/\/dev.azure.com\/(\w+)\/([0-9a-z-]+)\/_workitems\/edit\/(\d+)/);
                if (m) {
                    return [m[1], m[2], m[3]];
                }
            }
            return null;
        }

        const id = getId();
        if (!id) {
            return;
        }

        GM_xmlhttpRequest({
            method:"GET",
            url: `https://dev.azure.com/${id[0]}/${id[1]}/_apis/wit/workitems/${id[2]}?api-version=6.0`,
            onload: function(response) {
                const value = JSON.parse(response.responseText);
                const title = value.fields["System.Title"];
                const description = value.fields["System.Description"];
                const titleElement = document.getElementsByClassName("js-issue-title")[0];
                titleElement.innerText = title;
                titleElement.innerHTML = "&#10024;" + titleElement.innerHTML;
                descElement.parentElement.insertAdjacentHTML("afterend", '<tr class="d-block"><td class="d-block" style="border-top:solid 1px var(--color-border-subtle); background: var(--color-canvas-subtle); color: var(--color-fg-default); overflow: auto">' + description + '</td></tr>');
            }
        });
    }

    function updateIssueList() {
        console.log("List");
        const allIssues = document.getElementsByClassName("js-issue-row");
        if (!allIssues) {
            return;
        }
        for(var issueElement of allIssues) {
            if (issueElement.chadnedzAzdoRan) {
                continue;
            }
            issueElement.chadnedzAzdoRan = true;
            const e = issueElement.getElementsByClassName("markdown-title")[0];
            if (e.innerText.match(/AzDO Issue #(\d+)/i)) {
                e.innerHTML = "&#8987;" + e.innerHTML;
                const linkMatch = e.href.match(/https:\/\/github\.com\/(\w+)\/(\w+)\/issues\/(\d+)/);
                if (linkMatch) {
                    GM_xmlhttpRequest({
                        method:"GET",
                        url: `https://api.github.com/repos/${linkMatch[1]}/${linkMatch[2]}/issues/${linkMatch[3]}`,
                        onload: function(response) {
                            const issueBody = JSON.parse(response.responseText).body;
                            const m = issueBody.match(/https:\/\/dev.azure.com\/(\w+)\/([0-9a-z-]+)\/_workitems\/edit\/(\d+)/);
                            if (m) {
                                GM_xmlhttpRequest({
                                    method:"GET",
                                    url: `https://dev.azure.com/${m[1]}/${m[2]}/_apis/wit/workitems/${m[3]}?api-version=6.0`,
                                    onload: function(response) {
                                        const value = JSON.parse(response.responseText);
                                        const title = value.fields["System.Title"];
                                        e.innerText = title;
                                        e.innerHTML = "&#10024;" + e.innerHTML;
                                    }
                                });
                            }
                        }
                    });
                }
            }
        }
    }

    function updateSidePanel() {
        let sidePanel = document.querySelector("[data-testid='side-panel']");
        if (sidePanel.chadnedzAzdoRan) {
            return;
        }
        let title = sidePanel.querySelector("[data-testid='side-panel-title'] a");
        if (!title) {
            return;
        }
        let desc = sidePanel.querySelector("[data-testid='comment-body']");
        function getId() {
            const links = desc.getElementsByTagName("a");
            for(const l of links) {
                const m = l.href.match(/https:\/\/dev.azure.com\/(\w+)\/([0-9a-z-]+)\/_workitems\/edit\/(\d+)/);
                if (m) {
                    return [m[1], m[2], m[3]];
                }
            }
            return null;
        }

        if (desc) {
            const id = getId();
            GM_xmlhttpRequest({
                method:"GET",
                url: `https://dev.azure.com/${id[0]}/${id[1]}/_apis/wit/workitems/${id[2]}?api-version=6.0`,
                onload: function(response) {
                    const value = JSON.parse(response.responseText);
                    const description = value.fields["System.Description"];
                    desc.insertAdjacentHTML("afterend", '<div style="border-top:solid 1px var(--color-border-subtle); background: var(--color-canvas-subtle); color: var(--color-fg-default); overflow: auto">' + description + '</div>');
                }
            });
        }
        sidePanel.chadnedzAzdoRan = true
    }

    function updateProjectBoard() {
        if (!document.querySelector("[data-testid='table-root']") && !document.querySelector("[data-testid='board-view']")) {
            return;
        }
        if (document.querySelector("[data-testid='side-panel']")) {
            updateSidePanel();
        } else {
        }

        const allIssues = document.getElementsByTagName("a");
        for(var issueElement of allIssues) {
            const e = issueElement
            if (e.innerText.match(/^AzDO Issue #(\d+)/i)) {
                e.innerHTML = "&#8987;" + e.innerHTML;
                const linkMatch = e.href.match(/https:\/\/github\.com\/(\w+)\/(\w+)\/issues\/(\d+)/);
                if (linkMatch) {
                    GM_xmlhttpRequest({
                        method:"GET",
                        url: `https://api.github.com/repos/${linkMatch[1]}/${linkMatch[2]}/issues/${linkMatch[3]}`,
                        onload: function(response) {
                            const issueBody = JSON.parse(response.responseText).body;
                            const m = issueBody.match(/https:\/\/dev.azure.com\/(\w+)\/([0-9a-z-]+)\/_workitems\/edit\/(\d+)/);
                            if (m) {
                                GM_xmlhttpRequest({
                                    method:"GET",
                                    url: `https://dev.azure.com/${m[1]}/${m[2]}/_apis/wit/workitems/${m[3]}?api-version=6.0`,
                                    onload: function(response) {
                                        const value = JSON.parse(response.responseText);
                                        const title = value.fields["System.Title"];
                                        e.innerText = title;
                                        e.innerHTML = "&#10024;" + e.innerHTML;
                                    }
                                });
                            }
                        }
                    });
                }
            }
        }
    }

    function updateMilestoneView() {
        const allIssues = document.getElementsByClassName("js-issue-row");
        if (!allIssues) {
            return;
        }
        for(var issueElement of allIssues) {
            if (issueElement.chadnedzAzdoRan) {
                continue;
            }
            issueElement.chadnedzAzdoRan = true;
            const e = issueElement.getElementsByClassName("markdown-title")[0];
            if (e.innerText.match(/AzDO Issue #(\d+)/i)) {
                e.innerHTML = "&#8987;" + e.innerHTML;
                const linkMatch = e.href.match(/https:\/\/github\.com\/(\w+)\/(\w+)\/issues\/(\d+)/);
                if (linkMatch) {
                    GM_xmlhttpRequest({
                        method:"GET",
                        url: `https://api.github.com/repos/${linkMatch[1]}/${linkMatch[2]}/issues/${linkMatch[3]}`,
                        onload: function(response) {
                            const issueBody = JSON.parse(response.responseText).body;
                            const m = issueBody.match(/https:\/\/dev.azure.com\/(\w+)\/([0-9a-z-]+)\/_workitems\/edit\/(\d+)/);
                            if (m) {
                                GM_xmlhttpRequest({
                                    method:"GET",
                                    url: `https://dev.azure.com/${m[1]}/${m[2]}/_apis/wit/workitems/${m[3]}?api-version=6.0`,
                                    onload: function(response) {
                                        const value = JSON.parse(response.responseText);
                                        const title = value.fields["System.Title"];
                                        e.innerText = title;
                                        e.innerHTML = "&#10024;" + e.innerHTML;
                                    }
                                });
                            }
                        }
                    });
                }
            }
        }
    }


    let timeout = null;
    function mmm(mutationList, o) {
        for (const mutation of mutationList) {
            if (mutation.type === 'childList') {
                if (timeout) {
                    window.clearTimeout(timeout);
                }
                timeout = window.setTimeout(() => handleUpdate(mutationList), 100);
            }
        }
    }

    const ccc = { childList: true, subtree: true};
    var mu = new MutationObserver(mmm);
    let mx = document.documentElement;
    function startObservation() {
        mu.observe(document.documentElement, ccc);
    }
    function stopObservation() {
        mu.disconnect();
    }
    startObservation();

})();

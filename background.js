var state = [];

function getTabState(tabId) {
	if (!state[tabId]) {
		state[tabId] = {};
	}
	
	return state[tabId];
}

chrome.webRequest.onBeforeRequest.addListener(function(details) {
	tabState = getTabState(details.tabId);

	tabState.originalURL   = details.url;
	tabState.tabID 		   = details.tabId;
	tabState.isRedirecting = false;

	if (!tabState.doNotRedirect) {
		tabState.isRedirecting = true;
		return { redirectUrl: details.url.replace("de-de", "en-us") };
	}
}, {
	urls : ["https://*.microsoft.com/de-de/*"]
}, ["blocking"]);

chrome.webRequest.onBeforeRequest.addListener(function(details) {
	getTabState(details.tabId).doNotRedirect = false;
}, {
	urls : ["https://*.microsoft.com/en-us/*"]
});

chrome.webRequest.onCompleted.addListener(function(details) {
	tabState = getTabState(details.tabId);
	if (tabState.isRedirecting) {
		tabState.isRedirecting = false;

		// Show popup
		chrome.tabs.executeScript(details.tabId, { file: "vendor/jquery-3.1.1.min.js" }, function() {
			chrome.tabs.executeScript(details.tabId, { file: "vendor/noty/jquery.noty.packaged.min.js" }, function() {
				chrome.tabs.insertCSS(details.tabId, {file: "vendor/noty/animate.css"}, function() {
					chrome.tabs.executeScript(details.tabId, { file: "popup.js" }, function() {
						// Send message to tab
						chrome.tabs.sendMessage(details.tabId, {message: "showPopup", state: tabState}, function(response) {
						  // no response
						});
					});
				});
			});
		});
	}
}, {
	urls : ["https://*.microsoft.com/en-us/*"]
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.message == "reverseRedirect") {
		var tabID = request.state.tabID;
		getTabState(tabID).doNotRedirect = true;
		chrome.tabs.update(tabID, {url: request.state.originalURL});
	}
});


chrome.pageAction.onClicked.addListener(function(tab) {
	tabState = getTabState(tab.id);
	tabState.doNotRedirect = !tabState.doNotRedirect;
	if (tabState.doNotRedirect)
		chrome.tabs.update(tab.id, {url: tab.url.replace("en-us", "de-de")});
	else
		chrome.tabs.update(tab.id, {url: tab.url.replace("de-de", "en-us")});
});

function updatePageActionTitle(tabId) {
	var pageActionTitle;
	if (getTabState(tabId).doNotRedirect)
		pageActionTitle = "Switch to english version.";
	else
		pageActionTitle = "Switch to german version.";

	chrome.pageAction.setTitle({tabId: tabId, title: pageActionTitle});
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	updatePageActionTitle(tabId);
});

chrome.tabs.onCreated.addListener(function(tab) {
	updatePageActionTitle(tab.id);
});

chrome.runtime.onInstalled.addListener(function() {
	chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
		chrome.declarativeContent.onPageChanged.addRules([
		{
			conditions: [
				new chrome.declarativeContent.PageStateMatcher({
					pageUrl: { hostSuffix: '.microsoft.com', pathPrefix: '/en-us' },
				}),
				new chrome.declarativeContent.PageStateMatcher({
					pageUrl: { hostSuffix: '.microsoft.com', pathPrefix: '/de-de' },
				})
			],
			actions: [ new chrome.declarativeContent.ShowPageAction() ]
		}
		]);
	});
});
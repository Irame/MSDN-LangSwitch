var state = [];

chrome.webRequest.onBeforeRequest.addListener(function(details) {
	if (!state[details.tabId]) {
		state[details.tabId] = {};
	}

	state[details.tabId].originalURL   = details.url;
	state[details.tabId].tabID 		   = details.tabId;
	state[details.tabId].isRedirecting = false;

	if (!state[details.tabId].doNotRedirect) {
		state[details.tabId].isRedirecting = true;
		return { redirectUrl: details.url.replace("de-de", "en-us") };
	}
}, {
	urls : ["https://msdn.microsoft.com/de-de/*"]
}, ["blocking"]);

chrome.webRequest.onBeforeRequest.addListener(function(details) {
	state[details.tabId].doNotRedirect = false;
}, {
	urls : ["https://msdn.microsoft.com/en-us/*"]
});

chrome.webRequest.onCompleted.addListener(function(details) {
	if (state[details.tabId].isRedirecting) {
		state[details.tabId].isRedirecting = false;

		// Show popup
		chrome.tabs.executeScript(details.tabId, { file: "vendor/jquery-3.1.1.min.js" }, function() {
			chrome.tabs.executeScript(details.tabId, { file: "vendor/noty/jquery.noty.packaged.min.js" }, function() {
				chrome.tabs.insertCSS(details.tabId, {file: "vendor/noty/animate.css"}, function() {
					chrome.tabs.executeScript(details.tabId, { file: "popup.js" }, function() {
						// Send message to tab
						chrome.tabs.sendMessage(details.tabId, {message: "showPopup", state: state[details.tabId]}, function(response) {
						  // no response
						});
					});
				});
			});
		});
	}
}, {
	urls : ["https://msdn.microsoft.com/en-us/*"]
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.message == "reverseRedirect") {
		var tabID = request.state.tabID;
		state[tabID].doNotRedirect = true;
		chrome.tabs.update(tabID, {url: request.state.originalURL});
	}
});


chrome.pageAction.onClicked.addListener(function(tab) {
	state[tab.id].doNotRedirect = !state[tab.id].doNotRedirect;
	chrome.tabs.update(tab.id, {url: state[tab.id].originalURL});
});

function updatePageActionTitle(tabId) {
	var pageActionTitle;
	if (state[tabId].doNotRedirect)
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
					pageUrl: { hostEquals: 'msdn.microsoft.com', pathPrefix: '/en-us' },
				}),
				new chrome.declarativeContent.PageStateMatcher({
					pageUrl: { hostEquals: 'msdn.microsoft.com', pathPrefix: '/de-de' },
				})
			],
			actions: [ new chrome.declarativeContent.ShowPageAction() ]
		}
		]);
	});
});

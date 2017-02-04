chrome.runtime.onInstalled.addListener(function() {
	var storage = {
		excludedTabs: {}
	};

	chrome.webRequest.onBeforeRequest.addListener(function(details) {
		if (!storage.excludedTabs[details.tabId.toString()]) {
			return { redirectUrl: details.url.replace("de-de", "en-us") };
		}
	}, {
		urls : ["https://msdn.microsoft.com/de-de/*"]
	}, ["blocking"]);
	
	chrome.webRequest.onBeforeRequest.addListener(function(details) {
		storage.excludedTabs[details.tabId.toString()] = null;
	}, {
		urls : ["https://msdn.microsoft.com/en-us/*"]
	});

	chrome.pageAction.onClicked.addListener(function(tab) {
		storage.excludedTabs[tab.id.toString()] = !storage.excludedTabs[tab.id.toString()];
		chrome.tabs.update(tab.id, {url: tab.url.replace("en-us", "de-de")});
	});
	
	function updatePageActionTitle(tabId) {
		var pageActionTitle;
		if (storage.excludedTabs[tabId.toString()])
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
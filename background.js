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

	chrome.webRequest.onCompleted.addListener(function(details) {
		// TODO only show popup if we were actually redirected
		// Show popup
		chrome.tabs.executeScript(null, { file: "vendor/jquery-3.1.1.min.js" }, function() {
			chrome.tabs.executeScript(null, { file: "vendor/noty/jquery.noty.packaged.min.js" }, function() {
				chrome.tabs.insertCSS(null, {file: "vendor/noty/animate.css"}, function() {
					chrome.tabs.executeScript(null, { file: "popup.js" }, function() {
						// Send message to active tab
						// TODO pass URL to popup.js
						chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
						  chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello"}, function(response) {
						    console.log(response);
						  });
						});
					});
				});
			});
		});
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

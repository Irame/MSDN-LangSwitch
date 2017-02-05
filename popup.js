function showPopup() {

    var text = "Redirected from German MSDN page. Click here to go back.";

    var n = noty({
        text        : text,
        type        : 'information',
        dismissQueue: true,
        progressBar : false,
        timeout     : 3000,
        layout      : 'bottomRight',
        closeWith   : ['click'],
        theme       : 'relax',
        maxVisible  : 1,
        animation   : {
            open  : 'animated fadeIn',
            close : 'animated fadeOut',
            easing: 'swing',
            speed : 500
        }
      });

    return n;
}

chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    if (request.greeting == "hello") {
      sendResponse({farewell: "goodbye"});
    }
    // TODO
    showPopup();
  });

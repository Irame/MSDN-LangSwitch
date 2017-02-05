function showPopup(state) {

    var text = 'Redirected from German MSDN page. <br /> <a id="goBackButton" href="javascript:void(0)">Click here to go back.</a>';

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
        },
        callback: {
            afterShow: function() {
                $("#goBackButton").click(function () {
                    chrome.runtime.sendMessage({message: "reverseRedirect", state: state});
                });
            }
        }
      });

    return n;
}

chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
    if (request.message == "showPopup") {
        showPopup(request.state);
    }
});

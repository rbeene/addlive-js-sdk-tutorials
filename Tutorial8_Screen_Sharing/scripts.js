

(function (w) {
  'use strict';

  var ADLT = w.ADLT,
      log = ADLT.log;

/**
 * Id of media scope to connect to upon user's request.
 * @type {String}
 */
ADLT.SCOPE_ID = 'Tutorial8';

/**
 * Configuration of the streams to publish upon connection established
 * @type {Object}
 */
ADLT.CONNECTION_CONFIGURATION = {

  /**
   * Flags defining that streams shouldn't be automatically published upon connection.
   */
  autopublishVideo:false,
  autopublishAudio:false
};

ADLT.APPLICATION_ID = 1;

ADLT.APP_SHARED_SECRET = 'CloudeoTestAccountSecret';


ADLT.SCREEN_SHARING_SRC_PRV_WIDTH = 240;
ADLT.SCREEN_SHARING_SRC_PRV_HEIGHT = 160;

ADLT.isConnected = false;
ADLT.sharedItemId = null;

//  Create the list item renderer template
ADLT.SCREEN_SHARING_ITM_WIDGET_TMPL = null;

/**
 * Document ready callback - starts the AddLive platform initialization.
 */
ADLT.onDomReady = function () {
  log.debug('DOM loaded');
  ADLT.initAddLiveLogging();
  var initOptions = {applicationId: ADLT.APPLICATION_ID};
  ADLT.initializeAddLiveQuick(ADLT.onPlatformReady, initOptions);
  ADLT.SCREEN_SHARING_ITM_WIDGET_TMPL = $(
      '<li class="scr-share-src-itm">' +
          '<img src="/shared-assets/no_screenshot_available.png"/>' +
          '<p><\/p>' +
          '<\/li>');
};

ADLT.onPlatformReady = function () {
  log.debug('AddLive Platform ready.');
  ADLT.initServiceListener();
  ADLT.refreshScreenShareSources();
  ADLT.connect();
};

ADLT.initServiceListener = function () {
  log.debug('Initializing the AddLive Service Listener');

  // Instantiate the listener
  var listener = new ADL.AddLiveServiceListener();

  // Define the handler for user and media stream event
  /**
   * Handles new remote participant joined/left the scope
   * and publishing/unpublishing of a media stream.
   * @param {ADL.UserStateChangedEvent} e
   */
  var handlePublishEvent = function (e) {
    log.debug('Got new user event: ' + e.userId);
    if (e.screenPublished) {
      ADL.renderSink({sinkId:e.screenSinkId,
        containerId:'renderRemoteUser'});
      $('#remoteUserIdLbl').html(e.userId);
    } else {
      $('#renderRemoteUser').empty();
      $('#remoteUserIdLbl').html('undefined');
    }
  };

  listener.onUserEvent = handlePublishEvent;
  listener.onMediaStreamEvent = handlePublishEvent;

//  Add handler for video frame size change, to ensure that the aspec ratio
//  is being maintained
  listener.onVideoFrameSizeChanged = function (e) {
    $('#renderRemoteUser').css(ADLT.fitDims(e.width, e.height, 640, 480));
  };

  // Register the listener using created instance and prepared result handler.
  ADL.getService().addServiceListener(ADL.createResponder(), listener);

};

ADLT.connect = function () {
  log.debug('Establishing a connection to the AddLive Streaming Server');

  // Prepare the connection descriptor by cloning the configuration and
  // updating the URL and the token.
  var connDescriptor = $.extend({}, ADLT.CONNECTION_CONFIGURATION);
  connDescriptor.scopeId = ADLT.SCOPE_ID;
  var userId = ADLT.genRandomUserId();
  connDescriptor.authDetails = ADLT.genAuthDetails(connDescriptor.scopeId,
      userId);

  // Define the result handler
  var onSucc = function () {
    ADLT.isConnected = true;
  };

  // Define the error handler
  var onErr = function (errCode, errMessage) {
    log.error('Failed to establish the connection due to: ' + errMessage +
        '(err code: ' + errCode + ')');
  };

  // Request the SDK to establish the connection
  ADL.getService().connect(ADL.createResponder(onSucc, onErr), connDescriptor);
};

/**
 * Reloads the list of sources possible to be shared
 */
ADLT.refreshScreenShareSources = function () {
  $('#refreshBtn').unbind('click').addClass('disabled');
  ADL.getService().getScreenCaptureSources(
      ADL.createResponder(ADLT.showScreenShareSources),
      ADLT.SCREEN_SHARING_SRC_PRV_WIDTH);
};

/**
 * Publishes selected screen sharing source
 *
 * @param shareItemId id of source to be shared
 */
ADLT.publishShareItem = function (shareItemId) {
  if (ADLT.isConnected) {
    log.debug('Publishing screen share: ' + shareItemId);

    var onSucc = function () {
      log.debug('Screen share source published');
    };
    var onErr = function () {
      log.error('Screen share source publishing failed');
    };

    // Request the SDK to publish screen source
    ADL.getService().publish(ADL.createResponder(onSucc, onErr),
        ADLT.SCOPE_ID,
        ADL.MediaType.SCREEN,
        {windowId:shareItemId, nativeWidth: 960});
  } else {
    log.error('Connection needed to share screen.');
  }
};

/**
 * Stops publishing screen sharing item.
 *
 * @param callback function to be called after successful unpublish
 */
ADLT.unpublishShareItem = function (callback) {
  log.debug('Unpublishing screen share');
  var onSucc = function () {
    log.debug('Screen share source unpublished');
    if (callback) {
      callback();
    }
  };
  var onErr = function () {
    log.error('Screen share source unpublishing failed');
  };

  // Request the SDK to unpublish screen source
  ADL.getService().unpublish(ADL.createResponder(onSucc, onErr),
      ADLT.SCOPE_ID,
      ADL.MediaType.SCREEN);
};

/**
 * Lists the screen sharing sources.
 *
 * @param sources array of sources to be listed
 */
ADLT.showScreenShareSources = function (sources) {
  var $srcsList = $('#screenShareSources');

  // Remove the previous state
  $srcsList.html('');

  // Iterate through all the screen sharing sources given and append a
  // control widget to the list of screen sharing sources
  $.each(sources, ADLT.screenSharingItemAppender);

  // Enable refresh button if not enabled yet
  var $refreshBtn = $('#refreshBtn');
  if ($refreshBtn.hasClass('disabled')) {
    $refreshBtn.click(ADLT.refreshScreenShareSources).removeClass('disabled');
  }
};

/**
 *  Appends the screen sharing source widget to the screen sharing sources list.
 */
ADLT.screenSharingItemAppender = function (i, src) {
// Create a <li> wrapper for each one
  var $srcWrapper = ADLT.SCREEN_SHARING_ITM_WIDGET_TMPL.clone();

  // Mark as selected if was shared before
  if (ADLT.sharedItemId === src.id) {
    $srcWrapper.addClass('selected');
  }
  $srcWrapper.attr('id', 'shareItm' + i);

  // Check whether the AddLive Service managed to obtain the screen shot
  if (src.image.base64) {

    // Use the data URI scheme to fill the screen shot image
    // http://en.wikipedia.org/wiki/Data_URI_scheme
    $srcWrapper.find('img').
        attr('src', 'data:image/png;base64,' + src.image.base64).
        css(
        ADLT.fitDims(src.image.width, src.image.height,
            ADLT.SCREEN_SHARING_SRC_PRV_WIDTH,
            ADLT.SCREEN_SHARING_SRC_PRV_HEIGHT));
  }
  // Set the window title
  $srcWrapper.find('p').text(src.title);

  // Store the id of item to be shared
  $srcWrapper.attr('share-itm-id', src.id);


  // Register the click handler
  $srcWrapper.click(ADLT.screenSharingItmClickHandler);

  // Finally append the node
  $srcWrapper.appendTo($('#screenShareSources'));
};

/**
 * Handler for the click event of the screen sharing item widget
 */
ADLT.screenSharingItmClickHandler = function () {
  var $this = $(this);
  if ($this.hasClass('selected')) {
    // Unpublishing
    $this.removeClass('selected');
    ADLT.sharedItemId = null;
    ADLT.unpublishShareItem();
  } else {
    // Publish
    // Update selection status
    $('.scr-share-src-itm').removeClass('selected');
    $this.addClass('selected');

    // Get the id of selected window
    var shareItemId = $this.attr('share-itm-id');

    // Create function for publishing
    // It is run after successful ADL.unpublish
    // of directly (if nothing is published so far)
    var publishFunction = function () {
      ADLT.sharedItemId = shareItemId;
      ADLT.publishShareItem(shareItemId);
    };

    if (ADLT.sharedItemId === null) {
      publishFunction();
    } else {
      ADLT.unpublishShareItem(publishFunction);
    }
  }
};


ADLT.fitDims = function (srcW, srcH, targetW, targetH) {
  var srcAR = srcW / srcH;
  var targetAR = targetW / targetH;
  var width, height, padding;

  if (srcW < targetW && srcH < targetH) {
    return {
      width:srcW,
      height:srcH,
      'margin-top':(targetH - srcH) / 2,
      'margin-bottom':(targetH - srcH) / 2,
      'margin-left':(targetW - srcW) / 2
    };
  }
  if (srcAR < targetAR) {
//      match height
    height = targetH;
    width = srcW * targetH / srcH;
    padding = (targetW - width) / 2;
    return {
      width:width,
      height:height,
      'margin-left':padding,
      'margin-right':padding,
      'margin-top':0,
      'margin-bottom':0
    };
  } else {
    //    match width
    width = targetW;
    height = targetW * srcH / srcW;
    padding = (targetH - height) / 2;
    return {
      width:width,
      height:height,
      'margin-left':0,
      'margin-right':0,
      'margin-top':padding,
      'margin-bottom':padding
    };

  }
};

ADLT.genAuthDetails = function (scopeId, userId) {

  // New Auth API
  var dateNow = new Date();
  var now = Math.floor((dateNow.getTime() / 1000));
  var authDetails = {
    // Token valid 5 mins
    expires:now + (5 * 60),
    userId:userId,
    salt:ADLT.randomString(100)
  };
  var signatureBody =
      ADLT.APPLICATION_ID +
          scopeId +
          userId +
          authDetails.salt +
          authDetails.expires +
          ADLT.APP_SHARED_SECRET;
  authDetails.signature =
      w.CryptoJS.SHA256(signatureBody).toString(w.CryptoJS.enc.Hex).toUpperCase();
  return authDetails;
};

/**
 * Register the document ready handler.
 */
$(ADLT.onDomReady);

})(window);
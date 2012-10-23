/**
 * Id of media scope to connect to upon user's request.
 * @type {String}
 */
CDOT.SCOPE_ID = 'Tutorial8';

/**
 * Configuration of the streams to publish upon connection established
 * @type {Object}
 */
CDOT.CONNECTION_CONFIGURATION = {

  /**
   * Description of the base line video stream - the low layer. It's QVGA, with
   * bitrate equal to 64kbps and 5 frames per second
   */
  lowVideoStream:{
    publish:true,
    receive:true,
    maxWidth:320,
    maxHeight:240,
    maxBitRate:64,
    maxFps:5
  },

  /**
   * Description of the adaptive video stream - the high layer. It's QVGA, with
   * 400kbps of bitrate and 15 frames per second
   */
  highVideoStream:{
    publish:true,
    receive:true,
    maxWidth:320,
    maxHeight:240,
    maxBitRate:400,
    maxFps:15
  },

  /**
   * Flags defining that streams shouldn't be automatically published upon connection.
   */
  autopublishVideo:false,
  autopublishAudio:false
};

CDOT.SCREEN_SHARING_SRC_PRV_WIDTH = 240;
CDOT.SCREEN_SHARING_SRC_PRV_HEIGHT = 160;

CDOT.isConnected = false;
CDOT.sharedItemId = null;

//  Create the list item renderer template
CDOT.SCREEN_SHARING_ITM_WIDGET_TMPL = null;

/**
 * Document ready callback - starts the Cloudeo platform initialization.
 */
CDOT.onDomReady = function () {
  log.debug('DOM loaded');
  CDOT.initCloudeoLogging();
  CDOT.initializeCloudeoQuick(CDOT.onPlatformReady);
  CDOT.SCREEN_SHARING_ITM_WIDGET_TMPL = $(
      '<li class="scr-share-src-itm">' +
          '<img src="/shared-assets/no_screenshot_available.png"/>' +
          '<p><\/p>' +
          '<\/li>');
};

CDOT.onPlatformReady = function () {
  log.debug('Cloudeo Platform ready.');
  CDOT.initServiceListener();
  CDOT.refreshScreenShareSources();
  CDOT.connect();
};

CDOT.initServiceListener = function () {
  log.debug('Initializing the Cloudeo Service Listener');

  // Instantiate the listener
  var listener = new CDO.CloudeoServiceListener();

  // Define the handler for user and media stream event
  /**
   * Handles new remote participant joined/left the scope
   * and publishing/unpublishing of a media stream.
   * @param {CDO.UserStateChangedEvent} e
   */
  var handlePublishEvent = function (e) {
    log.debug('Got new user event: ' + e.userId);
    if (e.screenPublished) {
      CDO.renderSink({sinkId:e.screenSinkId,
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
    $('#renderRemoteUser').css(CDOT.fitDims(e.width, e.height, 640, 480));
  };

  // Register the listener using created instance and prepared result handler.
  CDO.getService().addServiceListener(CDO.createResponder(), listener);

};

CDOT.connect = function () {
  log.debug('Establishing a connection to the Cloudeo Streaming Server');

  // Prepare the connection descriptor by cloning the configuration and
  // updating the URL and the token.
  var connDescriptor = $.extend({}, CDOT.CONNECTION_CONFIGURATION);
  connDescriptor.scopeId = CDOT.SCOPE_ID;
  connDescriptor.token = CDOT.genRandomUserId();

  // Define the result handler
  var onSucc = function () {
    CDOT.isConnected = true;
  };

  // Define the error handler
  var onErr = function (errCode, errMessage) {
    log.error('Failed to establish the connection due to: ' + errMessage +
                  '(err code: ' + errCode + ')');
  };

  // Request the SDK to establish the connection
  CDO.getService().connect(CDO.createResponder(onSucc, onErr), connDescriptor);
};

/**
 * Reloads the list of sources possible to be shared
 */
CDOT.refreshScreenShareSources = function () {
  $('#refreshBtn').unbind('click').addClass('disabled');
  CDO.getService().getScreenCaptureSources(
      CDO.createResponder(CDOT.showScreenShareSources),
      CDOT.SCREEN_SHARING_SRC_PRV_WIDTH);
};

/**
 * Publishes selected screen sharing source
 *
 * @param shareItemId id of source to be shared
 */
CDOT.publishShareItem = function (shareItemId) {
  if (CDOT.isConnected) {
    log.debug('Publishing screen share: ' + shareItemId);

    var onSucc = function () {
      log.debug('Screen share source published');
    };
    var onErr = function () {
      log.error('Screen share source publishing failed');
    };

    // Request the SDK to publish screen source
    CDO.getService().publish(CDO.createResponder(onSucc, onErr),
                             CDOT.SCOPE_ID,
                             CDO.MediaType.SCREEN,
                             {'windowId':shareItemId});
  } else {
    log.error('Connection needed to share screen.');
  }
};

/**
 * Stops publishing screen sharing item.
 *
 * @param callback function to be called after successful unpublish
 */
CDOT.unpublishShareItem = function (callback) {
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
  CDO.getService().unpublish(CDO.createResponder(onSucc, onErr),
                             CDOT.SCOPE_ID,
                             CDO.MediaType.SCREEN);
};

/**
 * Lists the screen sharing sources.
 *
 * @param sources array of sources to be listed
 */
CDOT.showScreenShareSources = function (sources) {
  var $srcsList = $('#screenShareSources');

  // Remove the previous state
  $srcsList.html('');

  // Iterate through all the screen sharing sources given and append a
  // control widget to the list of screen sharing sources
  $.each(sources, CDOT.screenSharingItemAppender);

  // Enable refresh button if not enabled yet
  var $refreshBtn = $('#refreshBtn');
  if ($refreshBtn.hasClass('disabled')) {
    $refreshBtn.click(CDOT.refreshScreenShareSources).removeClass('disabled');
  }
};

/**
 *  Appends the screen sharing source widget to the screen sharing sources list.
 */
CDOT.screenSharingItemAppender = function (i, src) {
// Create a <li> wrapper for each one
  var $srcWrapper = CDOT.SCREEN_SHARING_ITM_WIDGET_TMPL.clone();

  // Mark as selected if was shared before
  if (CDOT.sharedItemId == src.id) {
    $srcWrapper.addClass('selected');
  }
  $srcWrapper.attr('id', 'shareItm' + i);

  // Check whether the Cloudeo Service managed to obtain the screen shot
  if (src.image.base64) {

    // Use the data URI scheme to fill the screen shot image
    // http://en.wikipedia.org/wiki/Data_URI_scheme
    $srcWrapper.find('img').
        attr('src', 'data:image/png;base64,' + src.image.base64).
        css(
        CDOT.fitDims(src.image.width, src.image.height,
                     CDOT.SCREEN_SHARING_SRC_PRV_WIDTH,
                     CDOT.SCREEN_SHARING_SRC_PRV_HEIGHT));
  }
  // Set the window title
  $srcWrapper.find('p').text(src.title);

  // Store the id of item to be shared
  $srcWrapper.attr('share-itm-id', src.id);


  // Register the click handler
  $srcWrapper.click(CDOT.screenSharingItmClickHandler);

  // Finally append the node
  $srcWrapper.appendTo($('#screenShareSources'));
};

/**
 * Handler for the click event of the screen sharing item widget
 */
CDOT.screenSharingItmClickHandler = function () {
  var $this = $(this);
  if ($this.hasClass('selected')) {
    // Unpublishing
    $this.removeClass('selected');
    CDOT.sharedItemId = null;
    CDOT.unpublishShareItem();
  } else {
    // Publish
    // Update selection status
    $('.scr-share-src-itm').removeClass('selected');
    $this.addClass('selected');

    // Get the id of selected window
    var shareItemId = $this.attr('share-itm-id');

    // Create function for publishing
    // It is run after successful CDO.unpublish
    // of directly (if nothing is published so far)
    var publishFunction = function () {
      CDOT.sharedItemId = shareItemId;
      CDOT.publishShareItem(shareItemId);
    };

    if (CDOT.sharedItemId === null) {
      publishFunction();
    } else {
      CDOT.unpublishShareItem(publishFunction);
    }
  }
};


CDOT.fitDims = function (srcW, srcH, targetW, targetH) {
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


/**
 * Register the document ready handler.
 */
$(CDOT.onDomReady);

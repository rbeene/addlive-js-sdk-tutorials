

(function (w) {
  'use strict';

  // IE shim - for IE 8+ the console object is defined only if the dev tools
  // are acive
  if (!window.console) {
    console = {
      log:function() {},
      warn:function() {}
    };
  }

  /**
   * Id of media scope to connect to upon user's request.
   * @type {String}
   */
  var SCOPE_ID = ADLT.SCOPE_ID; // To set your own SCOPE_ID
  // (check shared-assets/scripts.js)

  /**
   * Configuration of the streams to publish upon connection established
   * @type {Object}
   */
  var CONNECTION_CONFIGURATION = {

    /**
     * Flags defining that streams shouldn't be automatically published
     * upon connection.
     */
    autopublishVideo:false,
    autopublishAudio:false
  };

  // To set your own APP_ID (check shared-assets/scripts.js)
  var APPLICATION_ID = ADLT.APP_ID;

  // To set your own API_KEY (check shared-assets/scripts.js)
  var APP_SHARED_SECRET = ADLT.API_KEY;


  var SCREEN_SHARING_SRC_PRV_WIDTH = 240;
  var SCREEN_SHARING_SRC_PRV_HEIGHT = 160;

  var isConnected = false;
  var sharedItemId = null;

  //  Create the list item renderer template
  var SCREEN_SHARING_ITM_WIDGET_TMPL = null;

  /**
   * Document ready callback - starts the AddLive platform initialization.
   */
  function onDomReady () {
    console.log('DOM loaded');

    // assuming the initAddLiveLogging is exposed
    // via ADLT namespace. (check shared-assets/scripts.js)
    ADLT.initAddLiveLogging();
    var initOptions = {applicationId: APPLICATION_ID};
    // Initializes the AddLive SDK.
    initializeAddLive(initOptions);
    SCREEN_SHARING_ITM_WIDGET_TMPL = $(
        '<li class="scr-share-src-itm">' +
        '<img src="/shared-assets/no_screenshot_available.png"/>' +
        '<p><\/p>' +
        '<\/li>');
  }

  /**
   * Initializes the AddLive SDK.
   */
  function initializeAddLive(options) {
    console.log("Initializing the AddLive SDK");

    // Step 1 - create the PlatformInitListener and overwrite it's methods.
    var initListener = new ADL.PlatformInitListener();

    // Define the handler for initialization state changes
    initListener.onInitStateChanged = function (e) {
      switch (e.state) {

        case ADL.InitState.ERROR:
          // After receiving this status, the initialization is stopped as
          // due tutorial a failure.
          console.error("Failed to initialize the AddLive SDK");
          console.error("Reason: " + e.errMessage + ' (' + e.errCode + ')');
          break;

        case ADL.InitState.INITIALIZED:
          //This state flag indicates that the AddLive SDK is initialized and fully
          //functional.
          console.log("AddLive SDK fully functional");
          onPlatformReady();
          break;

        case ADL.InitState.INSTALLATION_REQUIRED:
          // Current user doesn't have the AddLive Plug-In installed and it is
          // required - use provided URL to ask the user to install the Plug-in.
          // Note that the initialization process is just frozen in this state -
          // the SDK polls for plug-in availability and when it becomes available,
          // continues with the initialization.
          console.log("AddLive Plug-in installation required");
          $('#installBtn').attr('href', e.installerURL).css('display', 'block');
          break;
        case ADL.InitState.INSTALLATION_COMPLETE:
          console.log("AddLive Plug-in installation complete");
          $('#installBtn').hide();
          break;

        case ADL.InitState.BROWSER_RESTART_REQUIRED:
          // This state indicates that AddLive SDK performed auto-update and in
          // order to accomplish this process, browser needs to be restarted.
          console.log("Please restart your browser in order to complete platform auto-update");
          break;

        case ADL.InitState.DEVICES_INIT_BEGIN:
          // This state indicates that AddLive SDK performed auto-update and
          // in order to accomplish this process, browser needs to be restarted.
          console.log("Devices initialization started");
          break;

        default:
          // Default handler, just for sanity
          console.log("Got unsupported init state: " + e.state);
      }
    };

    // Step 2. Actually trigger the asynchronous initialization of the AddLive SDK.
    ADL.initPlatform(initListener, options);
  }

  function onPlatformReady () {
    console.log('AddLive Platform ready.');
    initServiceListener();
    refreshScreenShareSources();
    connect();
  }

  function initServiceListener () {
    console.log('Initializing the AddLive Service Listener');

    // Instantiate the listener
    var listener = new ADL.AddLiveServiceListener();

    // Define the handler for user and media stream event
    /**
     * Handles new remote participant joined/left the scope
     * and publishing/unpublishing of a media stream.
     * @param {ADL.UserStateChangedEvent} e
     */
    var handlePublishEvent = function (e) {
      console.log('Got new user event: ' + e.userId);
      if (e.screenPublished) {
        ADL.renderSink({sinkId:e.screenSinkId, containerId:'renderRemoteUser'});
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
      $('#renderRemoteUser').css(fitDims(e.width, e.height, 640, 480));
    };

    // Register the listener using created instance and prepared result handler.
    ADL.getService().addServiceListener(ADL.r(), listener);

  }

  function connect () {
    console.log('Establishing a connection to the AddLive Streaming Server');

    // Prepare the connection descriptor by cloning the configuration and
    // updating the URL and the token.
    var connDescriptor = $.extend({}, CONNECTION_CONFIGURATION);
    connDescriptor.scopeId = SCOPE_ID;
    var userId = ADLT.genRandomUserId();
    connDescriptor.authDetails = genAuthDetails(connDescriptor.scopeId, userId);

    // Define the result handler
    var onSucc = function () {
      isConnected = true;
    };

    // Define the error handler
    var onErr = function (errCode, errMessage) {
      console.error('Failed to establish the connection due to: ' + errMessage +
      '(err code: ' + errCode + ')');
    };

    // Request the SDK to establish the connection
    ADL.getService().connect(ADL.r(onSucc, onErr), connDescriptor);
  }

  /**
   * Reloads the list of sources possible to be shared
   */
  function refreshScreenShareSources () {
    $('#refreshBtn').unbind('click').addClass('disabled');
    ADL.getService().getScreenCaptureSources(
        ADL.r(showScreenShareSources), SCREEN_SHARING_SRC_PRV_WIDTH);
  }

  /**
   * Publishes selected screen sharing source
   *
   * @param shareItemId id of source to be shared
   */
  function publishShareItem (shareItemId) {
    if (isConnected) {
      console.log('Publishing screen share: ' + shareItemId);

      var onSucc = function () {
        console.log('Screen share source published');
      };
      var onErr = function () {
        console.error('Screen share source publishing failed');
      };

      // Request the SDK to publish screen source
      ADL.getService().publish(ADL.r(onSucc, onErr),
          SCOPE_ID,
          ADL.MediaType.SCREEN,
          {windowId:shareItemId, nativeWidth: 960});
    } else {
      console.error('Connection needed to share screen.');
    }
  }

  /**
   * Stops publishing screen sharing item.
   *
   * @param callback function to be called after successful unpublish
   */
  function unpublishShareItem (callback) {
    console.log('Unpublishing screen share');
    var onSucc = function () {
      console.log('Screen share source unpublished');
      if (callback) {
        callback();
      }
    };
    var onErr = function () {
      console.error('Screen share source unpublishing failed');
    };

    // Request the SDK to unpublish screen source
    ADL.getService().unpublish(ADL.r(onSucc, onErr),
        SCOPE_ID,
        ADL.MediaType.SCREEN);
  }

  /**
   * Lists the screen sharing sources.
   *
   * @param sources array of sources to be listed
   */
  function showScreenShareSources (sources) {
    var $srcsList = $('#screenShareSources');

    // Remove the previous state
    $srcsList.html('');

    // Iterate through all the screen sharing sources given and append a
    // control widget to the list of screen sharing sources
    $.each(sources, screenSharingItemAppender);

    // Enable refresh button if not enabled yet
    var $refreshBtn = $('#refreshBtn');
    if ($refreshBtn.hasClass('disabled')) {
      $refreshBtn.click(refreshScreenShareSources).removeClass('disabled');
    }
  }

  /**
   *  Appends the screen sharing source widget to the screen sharing sources list.
   */
  function screenSharingItemAppender (i, src) {
  // Create a <li> wrapper for each one
    var $srcWrapper = SCREEN_SHARING_ITM_WIDGET_TMPL.clone();

    // Mark as selected if was shared before
    if (sharedItemId === src.id) {
      $srcWrapper.addClass('selected');
    }
    $srcWrapper.attr('id', 'shareItm' + i);

    // Check whether the AddLive Service managed to obtain the screen shot
    if (src.image.base64) {

      // Use the data URI scheme to fill the screen shot image
      // http://en.wikipedia.org/wiki/Data_URI_scheme
      $srcWrapper.find('img').
          attr('src', 'data:image/png;base64,' + src.image.base64).
          css(fitDims(src.image.width, src.image.height,
              SCREEN_SHARING_SRC_PRV_WIDTH,
              SCREEN_SHARING_SRC_PRV_HEIGHT));
    }
    // Set the window title
    $srcWrapper.find('p').text(src.title);

    // Store the id of item to be shared
    $srcWrapper.attr('share-itm-id', src.id);


    // Register the click handler
    $srcWrapper.click(screenSharingItmClickHandler);

    // Finally append the node
    $srcWrapper.appendTo($('#screenShareSources'));
  }

  /**
   * Handler for the click event of the screen sharing item widget
   */
  function screenSharingItmClickHandler () {
    var $this = $(this);
    if ($this.hasClass('selected')) {
      // Unpublishing
      $this.removeClass('selected');
      sharedItemId = null;
      unpublishShareItem();
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
        sharedItemId = shareItemId;
        publishShareItem(shareItemId);
      };

      if (sharedItemId === null) {
        publishFunction();
      } else {
        unpublishShareItem(publishFunction);
      }
    }
  }


  function fitDims (srcW, srcH, targetW, targetH) {
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
      // match height
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
      // match width
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
  }

  function genAuthDetails (scopeId, userId) {

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
            APPLICATION_ID +
            scopeId +
            userId +
            authDetails.salt +
            authDetails.expires +
            APP_SHARED_SECRET;
    authDetails.signature =
        w.CryptoJS.SHA256(signatureBody).toString(w.CryptoJS.enc.Hex).toUpperCase();
    return authDetails;
  }

  /**
   * Register the document ready handler.
   */
  $(onDomReady);
})(window);
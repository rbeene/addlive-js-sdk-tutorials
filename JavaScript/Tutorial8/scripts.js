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

CDOT.isConnected = false;
CDOT.sharedItemId = null;


/**
 * Document ready callback - starts the Cloudeo platform initialization.
 */
CDOT.onDomReady = function () {
  log.debug('DOM loaded');
  CDOT.initCloudeoLogging();
  CDOT.initializeCloudeoQuick(CDOT.onPlatformReady);
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
  var handlePublishEvent = function(e) {
    log.debug('Got new user event: ' + e.userId);
    if(e.screenPublished) {
      CDO.renderSink({sinkId: e.screenSinkId,
                      containerId: 'renderRemoteUser'});
      $('#remoteUserIdLbl').html(e.userId);
    } else {
      $('#renderRemoteUser').empty();
      $('#remoteUserIdLbl').html('undefined');
    }
  };

  listener.onUserEvent = handlePublishEvent;
  listener.onMediaStreamEvent = handlePublishEvent;

  // Register the listener using created instance and prepared result handler.
  CDO.getService().addServiceListener(CDO.createResponder(), listener);

};

CDOT.connect = function () {
  log.debug('Establishing a connection to the Cloudeo Streaming Server');

  // Prepare the connection descriptor by cloning the configuration and
  // updating the URL and the token.
  var connDescriptor = $.extend({}, CDOT.CONNECTION_CONFIGURATION);
  connDescriptor.scopeId = CDOT.SCOPE_ID;
  connDescriptor.token = CDOT.genRandomUserId() ;

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

CDOT.disconnect = function () {
  log.debug('Terminating the connection');

  // Define the result handler
  var onSucc = function () {
    log.debug('Connection terminated');
    CDOT.isConnected = false;
    $('#renderRemoteUser').empty();
    $('#remoteUserIdLbl').html('undefined');
  };

  // Request the SDK to terminate the connection.
  CDO.getService().disconnect(CDO.createResponder(onSucc), CDOT.SCOPE_ID);
};

CDOT.refreshScreenShareSources = function() {
  $('#refreshBtn').unbind('click').addClass('disabled');
  CDO.getService().getScreenCaptureSources(CDO.createResponder(CDOT.showScreenShareSources), 320);
};

CDOT.publishShareItem = function(shareItemId) {
  if(CDOT.isConnected) {
    log.debug('Publishing screen share: ' + shareItemId);
    var onSucc = function() {
      log.debug('Screen share source published');
    };
    var onErr = function() {
      log.error('Screen share source publishing failed');
    };

    // Request the SDK to publish screen source
    CDO.getService().publish(CDO.createResponder(onSucc, onErr),
                             CDOT.SCOPE_ID,
                             CDO.MediaType.SCREEN,
                             {'windowId': shareItemId});
  } else {
    log.error('Connection needed to share screen.');
  }
};

CDOT.unpublishShareItem = function(callback) {
  log.debug('Unpublishing screen share');
  var onSucc = function() {
    log.debug('Screen share source unpublished');
    if(callback)
      callback();
  };
  var onErr = function() {
    log.error('Screen share source unpublishing failed');
  };

  // Request the SDK to unpublish screen source
  CDO.getService().unpublish(CDO.createResponder(onSucc, onErr),
                             CDOT.SCOPE_ID,
                             CDO.MediaType.SCREEN);
};

CDOT.showScreenShareSources = function(sources) {
  var srcsList = document.getElementById('screenShareSources');

  // Clean "Loading..." message
  srcsList.innerHTML = '';

  // Iterate through all the screen sharing sources given
  for(var i = 0; i < sources.length; i++) {
    // Get the current share item
    var src = sources[i];

    // Create a <li> wrapper for each one
    var srcWrapper = document.createElement('li');
    srcWrapper.classList.add('scr-share-src-itm');

    // Mark as selected if was shared before
    if(CDOT.sharedItemId == src.id)
      srcWrapper.classList.add('selected');
    srcWrapper.id = 'shareItm' + i;

    // Create image for showing the screen grab preview
    var image = document.createElement('img');

    // Check whether the Cloudeo Service managed to obtain the scree shot
    if(src.image.base64) {

      // Use the data URI scheme
      // http://en.wikipedia.org/wiki/Data_URI_scheme
      image.src = 'data:image/png;base64,' + src.image.base64;
      image.width = src.image.width;
      image.height = src.image.height;
    } else {
      // Service failed to obtain the screen shot - fall back to place holder
      image.src = '/shared-assets/no_screenshot_available.png'
    }
  
    // Add the preview
    srcWrapper.appendChild(image);

    // Create the node with the window title
    var titleWrapper = document.createElement('p');
    titleWrapper.innerText = src.title;
    srcWrapper.appendChild(titleWrapper);

    // Register click handler to publish the screen
    srcWrapper.shareItem = src;
    srcWrapper.onclick = function(){
      if(this.classList.contains('selected')) {
        // Unpublishing
        this.classList.remove('selected');
        CDOT.sharedItemId = null;
        CDOT.unpublishShareItem();
      } else {
        // Publish
        // Update selection status
        $('.scr-share-src-itm').removeClass('selected');
        this.classList.add('selected');

        // Create callback for publishing
        // It is run after successful CDO.unpublish
        // of directly (if nothing is published)
        var shareItemId = this.shareItem.id;
        var publishCallback = function() {
          CDOT.sharedItemId = shareItemId;
          CDOT.publishShareItem(shareItemId);
        }
        
        if(CDOT.sharedItemId !== null)
          CDOT.unpublishShareItem(publishCallback);
        else
          publishCallback();
      }
    };

    // Finally append the node
    srcsList.appendChild(srcWrapper);
  }

  // Enable refresh button
  $('#refreshBtn').click(CDOT.refreshScreenShareSources).removeClass('disabled');
};


/**
 * Register the document ready handler.
 */
$(CDOT.onDomReady);

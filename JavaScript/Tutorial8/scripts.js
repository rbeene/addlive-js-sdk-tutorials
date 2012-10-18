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
  CDOT.initScreenShareSources();
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

  // Define result handler that will enable the connect button
  var onSucc = function () {
    $('#connectBtn').click(CDOT.connect).removeClass('disabled');
  };

  // Register the listener using created instance and prepared result handler.
  CDO.getService().addServiceListener(CDO.createResponder(onSucc), listener);

};

CDOT.connect = function (successCallback) {
  log.debug('Establishing a connection to the Cloudeo Streaming Server');

  // Disable the connect button to avoid connects cascade
  $('#connectBtn').unbind('click').addClass('disabled');

  // Prepare the connection descriptor by cloning the configuration and
  // updating the URL and the token.
  var connDescriptor = $.extend({}, CDOT.CONNECTION_CONFIGURATION);
  connDescriptor.scopeId = CDOT.SCOPE_ID;
  connDescriptor.token = CDOT.genRandomUserId() ;

  // Define the result handler
  var onSucc = function () {
    log.debug('Connected. Disabling connect button and enabling the disconnect');
    CDOT.isConnected = true;
    $('#disconnectBtn').click(CDOT.disconnect).removeClass('disabled');
    if(successCallback)
        successCallback();
  };

  // Define the error handler
  var onErr = function (errCode, errMessage) {
    log.error('Failed to establish the connection due to: ' + errMessage +
                  '(err code: ' + errCode + ')');
    $('#connectBtn').click(CDOT.connect).removeClass('disabled');
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
    $('#connectBtn').click(CDOT.connect).removeClass('disabled');
    $('#disconnectBtn').unbind('click').addClass('disabled');
    $('#renderRemoteUser').empty();
    $('#remoteUserIdLbl').html('undefined');
  };

  // Request the SDK to terminate the connection.
  CDO.getService().disconnect(CDO.createResponder(onSucc), CDOT.SCOPE_ID);
};

CDOT.initScreenShareSources = function() {
  CDO.getService().getScreenCaptureSources(CDO.createResponder(CDOT.showScreenShareSources), 320);
};

CDOT.publishShareItem = function(shareItem) {
  if(CDOT.isConnected) {
    log.debug('Publishing screen share: ' + shareItem.id);
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
                             {'windowId': shareItem.id});
  } else {
    log.error('Connection needed to share screen.');
  }
};

CDOT.showScreenShareSources = function(sources) {
  var srcsList = document.getElementById('screenShareSources');

  // Clean "Loading..." message
  srcsList.innerHTML = '';

  // Iterate through all the screen sharing sources given
  for(var i = 0; i < sources.length; i++) {
    // Create a <li> wrapper for each one
    var srcWrapper = document.createElement('div');
    srcWrapper.id = 'shareItm' + i;

    // Get the current share item
    var src = sources[i];

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
      CDOT.publishShareItem(this.shareItem);
    };

    // Finally append the node
    srcsList.appendChild(srcWrapper);
  }
};


/**
 * Register the document ready handler.
 */
$(CDOT.onDomReady);

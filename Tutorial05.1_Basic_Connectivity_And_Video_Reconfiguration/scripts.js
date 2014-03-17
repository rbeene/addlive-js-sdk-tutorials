/**
 * @fileoverview
 *
 * @author Tadeusz Kozak
 * @date 16-07-2013 19:59
 */

(function (w) {
  'use strict';


  // Constants
  // To set your own SCOPE_ID (check shared-assets/scripts.js)
  var SCOPE_ID = ADLT.SCOPE_ID,
  // To set your own APP_ID (check shared-assets/scripts.js)
      APPLICATION_ID = ADLT.APP_ID,
  // To set your own API_KEY (check shared-assets/scripts.js)
      APP_SHARED_SECRET = ADLT.API_KEY,

  // Video modes passed to the reconfigureVideo API.
      VIDEO_MODES = {
        0:{maxWidth:1280, maxHeight:720, maxFps:24, useAdaptation:true},
        1:{maxWidth:800, maxHeight:600, maxFps:24, useAdaptation:true},
        2:{maxWidth:640, maxHeight:480, maxFps:24, useAdaptation:true},
        3:{maxWidth:480, maxHeight:640, maxFps:24, useAdaptation:true},
        4:{maxWidth:320, maxHeight:240, maxFps:24, useAdaptation:true},
        5:{maxWidth:240, maxHeight:320, maxFps:24, useAdaptation:true},
        6:{maxWidth:160, maxHeight:120, maxFps:24, useAdaptation:true},
        7:{maxWidth:120, maxHeight:160, maxFps:24, useAdaptation:true}
      },

  // Selectors to be applied to local preview
      CSS_PREVIEW_DIMENSIONS = {
        0:{width:160, height:90},
        1:{width:160, height:120},
        2:{width:160, height:120},
        3:{width:120, height:160},
        4:{width:160, height:120},
        5:{width:120, height:160},
        6:{width:160, height:120},
        7:{width:120, height:160}
      };

  // Module variables
  var remotePeerSink,
      connected = false;

  /**
   * Document ready callback - starts the AddLive platform initialization.
   */
  function onDomReady() {
    console.log('DOM loaded');

    // assuming the initAddLiveLogging and initDevicesSelects are exposed via
    // ADLT namespace. (check shared-assets/scripts.js)
    ADLT.initAddLiveLogging();
    ADLT.initDevicesSelects();
    var initOptions = {applicationId:APPLICATION_ID};
    // Initializes the AddLive SDK.
    ADLT.initializeAddLiveQuick(onPlatformReady, initOptions);
    $('#resolutionSelect').change(onResolutionChange);
  }

  function onPlatformReady() {
    console.log('AddLive Platform ready.');
    ADLT.populateDevicesQuick();
    startLocalVideo();
    initServiceListener();
  }


  function startLocalVideo() {
    console.log('Starting local preview video feed');
    // 1. Prepare the result handler
    var resultHandler = function (sinkId) {
      console.log('Local preview started. Rendering the sink with id: ' + sinkId);
      ADL.renderSink({
        sinkId:sinkId,
        containerId:'renderLocalPreview',
        mirror:true
      });
    };

    // 2. Request the platform to start local video.
    ADL.getService().startLocalVideo(ADL.r(resultHandler));
  }

  function initServiceListener() {
    console.log('Initializing the AddLive Service Listener');

    // 1. Instantiate the listener
    var listener = new ADL.AddLiveServiceListener();

    // 2. Define the handler for user event

    /**
     * Handles new remote participant joined/left the scope.
     * @param {ADL.UserStateChangedEvent} e
     */
    listener.onUserEvent = function (e) {
      console.log('Got new user event: ' + e.userId);
      if (e.isConnected) {
        ADL.renderSink({
          sinkId:e.videoSinkId,
          containerId:'renderRemoteUser'
        });
        $('#remoteUserIdLbl').html(e.userId);
        remotePeerSink = e.videoSinkId;
      } else {
        $('#renderRemoteUser').empty();
        $('#remoteUserIdLbl').html('undefined');
        remotePeerSink = undefined;
      }

    };

    /**
     *
     * @param {ADL.VideoFrameSizeChangedEvent}e
     */
    listener.onVideoFrameSizeChanged = function (e) {
      console.log('Got video frame size changed notification: ' +
          JSON.stringify(e));
      if (e.sinkId === remotePeerSink) {
        $('#renderRemoteUser').css({width:e.width, height:e.height});
      }
    };

    // 3. Define result handler that will enable the connect button
    var onSucc = function () {
      $('#connectBtn').click(connect).removeClass('disabled');
    };

    // 4. Register the listener using created instance and prepared result handler.
    ADL.getService().addServiceListener(ADL.r(onSucc), listener);

  }

  function onResolutionChange() {
    var modeId = $('#resolutionSelect').val(),
        mode = VIDEO_MODES[modeId],
        previewMode = CSS_PREVIEW_DIMENSIONS[modeId];
    $('#renderLocalPreview').css({width:previewMode.width,
      height:previewMode.height});
    console.log('Changing resolution of video feed to: ' +
        JSON.stringify(mode));
    if (connected) {
      ADL.getService().reconfigureVideo(ADL.r(), SCOPE_ID, mode);
    }
  }

  function connect() {
    console.log('Establishing a connection to the AddLive Streaming Server');

    // 1. Disable the connect button to avoid connects cascade
    $('#connectBtn').unbind('click').addClass('disabled');

    // 2. Prepare the connection descriptor by cloning the configuration and
    // updating the URL and the token.
    var connDescriptor = {
      videoStream:{
        maxWidth:1280,
        maxHeight:720,
        maxFps:24,
        useAdaptation:true
      }
    };
    connDescriptor.scopeId = SCOPE_ID;
    connDescriptor.autopublishAudio = true;
    connDescriptor.autopublishVideo = true;

    // assuming the genRandomUserId is exposed via ADLT namespace.
    // (check shared-assets/scripts.js)
    var userId = ADLT.genRandomUserId();
    connDescriptor.authDetails = ADLT.genAuth(SCOPE_ID, userId, APPLICATION_ID,
        APP_SHARED_SECRET);

    // 3. Define the result handler
    var onSucc = function () {
      console.log('Connected. Disabling connect button and enabling the disconnect');
      $('#disconnectBtn').click(disconnect).removeClass('disabled');
      $('#localUserIdLbl').html(connDescriptor.authDetails.userId);
      connected = true;
    };

    // 4. Define the error handler
    var onErr = function (errCode, errMessage) {
      console.error('Failed to establish the connection due to: ' + errMessage +
          '(err code: ' + errCode + ')');
      // Enable the connect button again
      $('#connectBtn').click(connect).removeClass('disabled');
    };

    // 5. Request the SDK to establish the connection
    ADL.getService().connect(ADL.r(onSucc, onErr), connDescriptor);
  }

  function disconnect() {
    console.log('Terminating the connection');

    // 1. Define the result handler
    var onSucc = function () {
      console.log('Connection terminated');
      $('#connectBtn').click(connect).removeClass('disabled');
      $('#disconnectBtn').unbind('click').addClass('disabled');
      $('#renderRemoteUser').empty();
      $('#remoteUserIdLbl').html('undefined');
      $('#localUserIdLbl').html('undefined');
      connected = false;
    };

    // 2. Request the SDK to terminate the connection.
    ADL.getService().disconnect(ADL.r(onSucc), SCOPE_ID);
  }

  /**
   * Register the document ready handler.
   */
  $(onDomReady);
})();
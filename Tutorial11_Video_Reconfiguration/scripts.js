/**
 * @fileoverview
 *
 * @author Tadeusz Kozak
 * @date 16-07-2013 19:59
 */

(function (w) {
  'use strict';

  // Imports
  var ADLT = w.ADLT,
      log = ADLT.log;


  // Constants
  var SCOPE_ID = 'Tutorial10',
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
      VIDEO_MODES_PREVIEW = {
        0:{maxWidth:160, maxHeight:90, maxFps:24, useAdaptation:true},
        1:{maxWidth:160, maxHeight:120, maxFps:24, useAdaptation:true},
        2:{maxWidth:160, maxHeight:120, maxFps:24, useAdaptation:true},
        3:{maxWidth:120, maxHeight:160, maxFps:24, useAdaptation:true},
        4:{maxWidth:160, maxHeight:120, maxFps:24, useAdaptation:true},
        5:{maxWidth:120, maxHeight:160, maxFps:24, useAdaptation:true},
        6:{maxWidth:160, maxHeight:120, maxFps:24, useAdaptation:true},
        7:{maxWidth:120, maxHeight:160, maxFps:24, useAdaptation:true}
      },
      APPLICATION_ID = NaN, // Put your app Id here;
      APP_SHARED_SECRET = ''; // Put your API key here;

  // Module variables
  var remotePeerSink,
      connected = false;

  /**
   * Document ready callback - starts the AddLive platform initialization.
   */
  function onDomReady() {
    log.debug('DOM loaded');
    ADLT.initAddLiveLogging();
    ADLT.initDevicesSelects();
    var initOptions = {applicationId:APPLICATION_ID, skipUpdate:true};
    ADLT.initializeAddLiveQuick(onPlatformReady, initOptions);
    $('#resolutionSelect').change(onResolutionChange);

  }

  function onPlatformReady() {
    log.debug("AddLive Platform ready.");
    ADLT.populateDevicesQuick();
    startLocalVideo();
    initServiceListener();
  }


  function startLocalVideo() {
    log.debug("Starting local preview video feed");
//  1. Prepare the result handler
    var resultHandler = function (sinkId) {
      log.debug("Local preview started. Rendering the sink with id: " + sinkId);
      ADL.renderSink({
        sinkId:sinkId,
        containerId:'renderLocalPreview',
        mirror:true
      });
    };

//  2. Request the platform to start local video.
    ADL.getService().startLocalVideo(ADL.createResponder(resultHandler));
  }

  function initServiceListener() {
    log.debug("Initializing the AddLive Service Listener");

//  1. Instantiate the listener
    var listener = new ADL.AddLiveServiceListener();

//  2. Define the handler for user event
    /**
     * Handles new remote participant joined/left the scope.
     * @param {ADL.UserStateChangedEvent} e
     */
    listener.onUserEvent = function (e) {
      log.debug("Got new user event: " + e.userId);
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
    listener.onVideoFrameSizeChanged = function(e) {
      log.debug('Got video frame size changed notification: ' +
          JSON.stringify(e));
      if(e.sinkId === remotePeerSink) {
        $('#renderRemoteUser').css({width:e.width, height:e.height});
      }
    };

//  3. Define result handler that will enable the connect button
    var onSucc = function () {
      $('#connectBtn').click(connect).removeClass('disabled');
    };

//  4. Register the listener using created instance and prepared result handler.
    ADL.getService().addServiceListener(ADL.createResponder(onSucc), listener);

  }

  function onResolutionChange() {
    var modeId = $('#resolutionSelect').val(),
        mode = VIDEO_MODES[modeId],
        previewMode = VIDEO_MODES_PREVIEW[modeId];
    $('#renderLocalPreview').css({width:previewMode.maxWidth,height:previewMode.maxHeight});
    log.debug('Changing resolution of video feed to: ' +
        JSON.stringify(mode));
    if(connected) {
      ADL.getService().reconfigureVideo(ADL.r(), SCOPE_ID, mode);
    }
  }

  function connect() {
    log.debug("Establishing a connection to the AddLive Streaming Server");

//  1. Disable the connect button to avoid connects cascade
    $('#connectBtn').unbind('click').addClass('disabled');

//  2. Prepare the connection descriptor by cloning the configuration and
//     updating the URL and the token.
    var connDescriptor = {
      videoStream:{
        maxWidth:1280,
        maxHeight:720,
        maxFps:24,
        useAdaptation:true
      }
    };
    connDescriptor.scopeId = SCOPE_ID;
    var userId = ADLT.genRandomUserId();
    connDescriptor.authDetails =
        ADLT.genAuth(SCOPE_ID, userId, APPLICATION_ID, APP_SHARED_SECRET);

//  3. Define the result handler
    var onSucc = function () {
      log.debug("Connected. Disabling connect button and enabling the disconnect");
      $('#disconnectBtn').click(disconnect).removeClass('disabled');
      $('#localUserIdLbl').html(connDescriptor.authDetails.userId);
      connected = true;
    };

//  4. Define the error handler
    var onErr = function (errCode, errMessage) {
      log.error("Failed to establish the connection due to: " + errMessage +
          '(err code: ' + errCode + ')');
//    Enable the connect button again
      $('#connectBtn').click(connect).removeClass('disabled');
    };

//  5. Request the SDK to establish the connection
    ADL.getService().connect(ADL.createResponder(onSucc, onErr), connDescriptor);
  }

  function disconnect() {
    log.debug("Terminating the connection");

//  1. Define the result handler
    var onSucc = function () {
      log.debug("Connection terminated");
      $('#connectBtn').click(connect).removeClass('disabled');
      $('#disconnectBtn').unbind('click').addClass('disabled');
      $('#renderRemoteUser').empty();
      $('#remoteUserIdLbl').html('undefined');
      $('#localUserIdLbl').html('undefined');
      connected = false;
    };

//  2. Request the SDK to terminate the connection.
    ADL.getService().disconnect(ADL.createResponder(onSucc), SCOPE_ID);
  }

  /**
   * Register the document ready handler.
   */
  $(onDomReady);
})(window);
/**
 * @fileoverview
 * @TODO file description
 *
 * @author Juan Docal
 * @date 18-04-2014 11:53
 */

/**
  * @namespace Namespace for all AddLive tutorials definitions.
  */
var ADLT = ADLT || {};

ADLT.SCOPE_ID = '';

ADLT.APP_ID = '';

ADLT.API_KEY = '';

ADLT.AUTH_DETAILS = '';

(function (w) {
  'use strict';

  // To set your own SCOPE_ID (check main.php)
  var SCOPE_ID;

  // To set your own APP_ID (check main.php)
  var APPLICATION_ID;

  // To set your own API_KEY (check main.php)
  var APP_SHARED_SECRET;

  // To get the authentication details (check main.php)
  var AUTH_DETAILS;

  if (w.console === undefined) {
    ADLT.log = w.log4javascript.getLogger();
    window.log = ADLT.log;
    ADLT.logsAppender = new w.log4javascript.PopUpAppender();
    ADLT.log.addAppender(ADLT.logsAppender);
  } else {
    ADLT.log = w.console;
    if(ADLT.log.debug === undefined) {
      ADLT.log.debug = function(msg){
        ADLT.log.log(msg);
      };
    }
  }

  var log = ADLT.log;

  /**
   * Document ready callback - starts the AddLive platform initialization.
   */
  ADLT.init = function() {
    console.log('DOM loaded');

    SCOPE_ID = ADLT.SCOPE_ID;
    APPLICATION_ID = ADLT.APP_ID;
    APP_SHARED_SECRET = ADLT.API_KEY;
    AUTH_DETAILS = jQuery.parseJSON(ADLT.AUTH_DETAILS);

    initAddLiveLogging();
    initDevicesSelects();
    var initOptions = {applicationId:APPLICATION_ID};

    // Initializes the AddLive SDK.
    initializeAddLiveQuick(onPlatformReady, initOptions);
  }

  function onPlatformReady() {
    console.log('AddLive Platform ready.');

    populateDevicesQuick();
    startLocalVideo();
    initServiceListener();
  }


  function initAddLiveLogging() {
    ADL.initLogging(function (lev, msg) {
      switch (lev) {
        case ADL.LogLevel.DEBUG:
          log.debug("[ADL] " + msg);
          break;
        case ADL.LogLevel.WARN:
          log.warn("[ADL] " + msg);
          break;
        case ADL.LogLevel.ERROR:
          log.error("[ADL] " + msg);
          break;
        case ADL.LogLevel.INFO:
          log.debug("[ADL] " + msg);
          break;
        default:
          log.warn("Got unsupported log level: " + lev + ". Message: " +
              msg);
      }
    }, true);
  };

  /**
   * Initializes the AddLive SDK.
   */
  function initializeAddLiveQuick(completeHandler, options) {
    initAddLiveLogging();
    log.debug("Initializing the AddLive SDK");
    var initListener = new ADL.PlatformInitListener();
    initListener.onInitStateChanged = function (e) {
      switch (e.state) {
        case ADL.InitState.ERROR:
          log.error("Failed to initialize the AddLive SDK");
          log.error("Reason: " + e.errMessage + ' (' + e.errCode + ')');
          break;
        case ADL.InitState.INITIALIZED:
          completeHandler();
          break;
        case ADL.InitState.DEVICES_INIT_BEGIN:
          log.debug("Devices initialization started");
          break;
        default:
          log.warn("Got unsupported init state: " + e.state);
      }
    };
    ADL.initPlatform(initListener, options);
  };


  function initDevicesSelects() {
    $('#camSelect').change(getDevChangedHandler('VideoCapture'));
    $('#micSelect').change(getDevChangedHandler('AudioCapture'));
    $('#spkSelect').change(getDevChangedHandler('AudioOutput'));
  };

  function getDevChangedHandler(devType) {
    return function () {
      var selectedDev = $(this).val();
      ADL.getService()['set' + devType + 'Device'](
          ADL.createResponder(),
          selectedDev);
    };
  };

  /**
   * Fills the selects with the currently plugged in devices.
   */
  function populateDevicesQuick () {
    populateDevicesOfType('#camSelect', 'VideoCapture');
    populateDevicesOfType('#micSelect', 'AudioCapture');
    populateDevicesOfType('#spkSelect', 'AudioOutput');
  };

  /**
   * Fills the audio output devices select.
   */
  function populateDevicesOfType(selectSelector, devType) {
    var devsResultHandler = function (devs) {
      var $select = $(selectSelector);
      $select.empty();
      $.each(devs, function (devId, devLabel) {
        $('<option value="' + devId + '">' + devLabel + '</option>').
            appendTo($select);
      });
      var getDeviceHandler = function (device) {
        $select.val(device);
      };
      ADL.getService()['get' + devType + 'Device'](
          ADL.createResponder(getDeviceHandler));
    };
    ADL.getService()['get' + devType + 'DeviceNames'](
        ADL.createResponder(devsResultHandler));
  };

  function startLocalVideo() {
    console.log('Starting local preview video feed');
    //1. Prepare the result handler
    var resultHandler = function (sinkId) {
      console.log('Local preview started. Rendering the sink with id: ' + sinkId);
      ADL.renderSink({
        sinkId:sinkId,
        containerId:'renderLocalPreview',
        mirror:true
      });
    };

    //2. Request the platform to start local video.
    ADL.getService().startLocalVideo(ADL.r(resultHandler));
  }

  function initServiceListener() {
    console.log('Initializing the AddLive Service Listener');

    //1. Instantiate the listener
    var listener = new ADL.AddLiveServiceListener();

    //2. Define the handler for user event
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
      } else {
        $('#renderRemoteUser').empty();
        $('#remoteUserIdLbl').html('undefined');
      }

    };

    //3. Define result handler that will enable the connect button
    var onSucc = function () {
      $('#connectBtn').click(connect).removeClass('disabled');
    };

    //4. Register the listener using created instance and prepared result handler.
    ADL.getService().addServiceListener(ADL.r(onSucc), listener);

  }

  function connect() {
    console.log('Establishing a connection to the AddLive Streaming Server');

    //1. Disable the connect button to avoid connects cascade
    $('#connectBtn').unbind('click').addClass('disabled');

    //2. Prepare the connection descriptor by cloning the configuration
    // and updating the URL and the token.
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
    connDescriptor.authDetails = AUTH_DETAILS;

    //3. Define the result handler
    var onSucc = function () {
      console.log('Connected. Disabling connect button and enabling the disconnect');
      $('#disconnectBtn').click(disconnect).removeClass('disabled');
      $('#localUserIdLbl').html(connDescriptor.token);
    };

    //4. Define the error handler
    var onErr = function (errCode, errMessage) {
      console.error('Failed to establish the connection due to: ' + errMessage +
          '(err code: ' + errCode + ')');
      //Enable the connect button again
      $('#connectBtn').click(connect).removeClass('disabled');
    };

    //5. Request the SDK to establish the connection
    ADL.getService().connect(ADL.r(onSucc, onErr), connDescriptor);
  }

  function disconnect() {
    console.log('Terminating the connection');

    //1. Define the result handler
    var onSucc = function () {
      console.log('Connection terminated');
      $('#connectBtn').click(connect).removeClass('disabled');
      $('#disconnectBtn').unbind('click').addClass('disabled');
      $('#renderRemoteUser').empty();
      $('#remoteUserIdLbl').html('undefined');
      $('#localUserIdLbl').html('undefined');
    };

    //2. Request the SDK to terminate the connection.
    ADL.getService().disconnect(ADL.r(onSucc), SCOPE_ID);
  }

})(window);
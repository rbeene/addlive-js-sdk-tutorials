/**
 * @fileoverview
 * @TODO file description
 *
 * @author Tadeusz Kozak
 * @date 26-06-2012 10:37
 */

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
  // To set your own SCOPE_ID (check shared-assets/scripts.js)
  var SCOPE_ID = ADLT.SCOPE_ID;

  // To set your own APP_ID (check shared-assets/scripts.js)
  var APPLICATION_ID = ADLT.APP_ID;

  // To set your own API_KEY (check shared-assets/scripts.js)
  var APP_SHARED_SECRET = ADLT.API_KEY;

  /**
   * Document ready callback - starts the AddLive platform initialization.
   */
  function onDomReady () {
    console.log('DOM loaded');

    // assuming the initAddLiveLogging, initDevicesSelects and
    // initializeAddLiveQuick are exposed via ADLT namespace.
    // (check shared-assets/scripts.js)
    ADLT.initAddLiveLogging();
    ADLT.initDevicesSelects();
    var initOptions = {applicationId: APPLICATION_ID};
    ADLT.initializeAddLiveQuick(onPlatformReady, initOptions);
  }

  function onPlatformReady () {
    console.log("AddLive Platform ready.");

    // assuming the populateDevicesQuick is exposed via ADLT namespace.
    // (check shared-assets/scripts.js)
    ADLT.populateDevicesQuick();
    startLocalVideo();
    initServiceListener();
  }

  function startLocalVideo () {
    console.log("Starting local preview video feed");
    //1. Prepare the result handler
    var resultHandler = function (sinkId) {
      console.log("Local preview started. Rendering the sink with id: " + sinkId);
      ADL.renderSink({
        sinkId:sinkId,
        containerId:'renderLocalPreview',
        mirror:true
      });
    };

    //2. Request the platform to start local video.
    ADL.getService().startLocalVideo(ADL.r(resultHandler));
  }

  function initServiceListener () {
    console.log("Initializing the AddLive Service Listener");

    //1. Instantiate the listener
    var listener = new ADL.AddLiveServiceListener();

    //2. Define the handler for user event
    /**
     * Handles new remote participant joined/left the scope.
     * @param {ADL.UserStateChangedEvent} e
     */
    listener.onUserEvent = function (e) {
      console.log("Got new user event: " + e.userId);
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

  function connect () {
    console.log("Establishing a connection to the AddLive Streaming Server");

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
    connDescriptor.authDetails = genAuthDetails(ADLT.genRandomUserId());

    //3. Define the result handler
    var onSucc = function () {
      console.log("Connected. Disabling connect button and enabling the disconnect");
      $('#disconnectBtn').click(disconnect).removeClass('disabled');
      $('#localUserIdLbl').html(connDescriptor.token);
    };

    //4. Define the error handler
    var onErr = function (errCode, errMessage) {
      console.error("Failed to establish the connection due to: " + errMessage +
          '(err code: ' + errCode + ')');
      //Enable the connect button again
      $('#connectBtn').click(connect).removeClass('disabled');
    };

    //5. Request the SDK to establish the connection
    ADL.getService().connect(ADL.r(onSucc, onErr), connDescriptor);
  }

  function disconnect () {
    console.log("Terminating the connection");

    //1. Define the result handler
    var onSucc = function () {
      console.log("Connection terminated");
      $('#connectBtn').click(connect).removeClass('disabled');
      $('#disconnectBtn').unbind('click').addClass('disabled');
      $('#renderRemoteUser').empty();
      $('#remoteUserIdLbl').html('undefined');
      $('#localUserIdLbl').html('undefined');
    };

    //2. Request the SDK to terminate the connection.
    ADL.getService().disconnect(ADL.r(onSucc), SCOPE_ID);
  }

  /**
   * Generates sample authentication details. For more info about authentication,
   * please refer to: http://www.addlive.com/docs.html#authentication
   * @param userId
   *        Id of user to authenticate connection for
   * @return {Object}
   *        Generated authentication details object.
   */
  function genAuthDetails (userId) {

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
            SCOPE_ID +
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
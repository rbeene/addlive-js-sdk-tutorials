/**
 * @fileoverview
 * @TODO file description
 *
 * @author Tadeusz Kozak
 * @date 26-06-2012 10:37
 */

(function (w) {
  'use strict';

/**
 * Id of media scope to connect to upon user's request.
 * @type {String}
 */
var SCOPE_ID = '';

var APPLICATION_ID = NaN; // Put your app Id here;

var APP_SHARED_SECRET = ''; // Put your API key here;

var VIDEO_QUALITY_PROFILES = {
        0:{maxWidth:160, maxHeight:120, maxFps:5, useAdaptation:true},
        1:{maxWidth:320, maxHeight:240, maxFps:10, useAdaptation:true},
        2:{maxWidth:640, maxHeight:480, maxFps:24, useAdaptation:true}
      };

/**
 * Document ready callback - starts the AddLive platform initialization.
 */
function onDomReady () {
  console.log('DOM loaded');

  // assuming the initAddLiveLogging, initDevicesSelects and initializeAddLiveQuick are exposed via ADLT namespace. (check shared-assets/scripts.js)
  ADLT.initAddLiveLogging();
  ADLT.initDevicesSelects();
  var initOptions = {applicationId: APPLICATION_ID};
  ADLT.initializeAddLiveQuick(onPlatformReady, initOptions);
};

function onPlatformReady () {
  console.log("AddLive Platform ready.");

  // assuming the populateDevicesQuick is exposed via ADLT namespace. (check shared-assets/scripts.js)
  ADLT.populateDevicesQuick();
  startLocalVideo();
  initServiceListener();
};

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
  ADL.getService().startLocalVideo(ADL.createResponder(resultHandler));
};

function initServiceListener () {
  console.log("Initializing the AddLive Service Listener");

  // 1. Instantiate the listener
  var listener = new ADL.AddLiveServiceListener();

  // 2. Define the handler for user event
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

  // 3. Define result handler that will enable the connect button
  var onSucc = function () {
    $('#connectBtn').click(connect).removeClass('disabled');
  };

  // 4. Register the listener using created instance and prepared result handler.
  ADL.getService().addServiceListener(ADL.createResponder(onSucc), listener);

};

function initReconfigurationVideo () {

  // 1. Enable the slider
  $(".slider").removeAttr('disabled');

  // 2. Define the result handler
  var onSucc = function () {
    console.log("Video reconfigured");
  };

  // 3. Set the slider listener
  $(".slider").change(function(){
    ADL.getService().reconfigureVideo(ADL.createResponder(onSucc), SCOPE_ID, VIDEO_QUALITY_PROFILES[$(this).val()]);
  });
};

function connect () {
  console.log("Establishing a connection to the AddLive Streaming Server");

  // 1. Disable the connect button to avoid connects cascade
  $('#connectBtn').unbind('click').addClass('disabled');

  // 2. Prepare the connection descriptor by cloning the configuration and updating the URL and the token.
  var connDescriptor = {};
  connDescriptor.scopeId = SCOPE_ID;
  connDescriptor.authDetails = genAuthDetails(ADLT.genRandomUserId());

  // 3. Define the result handler
  var onSucc = function () {
    console.log("Connected. Disabling connect button and enabling the disconnect");
    $('#disconnectBtn').click(disconnect).removeClass('disabled');
    $('#localUserIdLbl').html(connDescriptor.token);
    initReconfigurationVideo();
  };

  // 4. Define the error handler
  var onErr = function (errCode, errMessage) {
    console.error("Failed to establish the connection due to: " + errMessage +
        '(err code: ' + errCode + ')');
    //Enable the connect button again
    $('#connectBtn').click(connect).removeClass('disabled');
  };

  // 5. Request the SDK to establish the connection
  ADL.getService().connect(ADL.createResponder(onSucc, onErr), connDescriptor);
};

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

  // 2. Request the SDK to terminate the connection.
  ADL.getService().disconnect(ADL.createResponder(onSucc), SCOPE_ID);
};

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
};


/**
 * Register the document ready handler.
 */
$(onDomReady);
})(window);
/**
 * @fileoverview
 * @TODO file description
 *
 * @author Tadeusz Kozak
 * @date 26-06-2012 10:37
 */


/**
 * Id of media scope to connect to upon user's request.
 * @type {String}
 */
ADLT.SCOPE_ID = 'Tutorial5';

ADLT.APPLICATION_ID = 1;

ADLT.APP_SHARED_SECRET = 'CloudeoTestAccountSecret';




/**
 * Document ready callback - starts the AddLive platform initialization.
 */
ADLT.onDomReady = function () {
  log.debug('DOM loaded');
  ADLT.initAddLiveLogging();
  ADLT.initDevicesSelects();
  var initOptions = {applicationId: ADLT.APPLICATION_ID};
  ADLT.initializeAddLiveQuick(ADLT.onPlatformReady, initOptions);
};

ADLT.onPlatformReady = function () {
  log.debug("AddLive Platform ready.");
  ADLT.populateDevicesQuick();
  ADLT.startLocalVideo();
  ADLT.initServiceListener();
};




ADLT.startLocalVideo = function () {
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
};

ADLT.initServiceListener = function () {
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
    } else {
      $('#renderRemoteUser').empty();
      $('#remoteUserIdLbl').html('undefined');
    }

  };

//  3. Define result handler that will enable the connect button
  var onSucc = function () {
    $('#connectBtn').click(ADLT.connect).removeClass('disabled');
  };

//  4. Register the listener using created instance and prepared result handler.
  ADL.getService().addServiceListener(ADL.createResponder(onSucc), listener);

};

ADLT.connect = function () {
  log.debug("Establishing a connection to the AddLive Streaming Server");

//  1. Disable the connect button to avoid connects cascade
  $('#connectBtn').unbind('click').addClass('disabled');

//  2. Prepare the connection descriptor by cloning the configuration and
//     updating the URL and the token.
  var connDescriptor = {};
  connDescriptor.scopeId = ADLT.SCOPE_ID;
  connDescriptor.authDetails = ADLT.genAuthDetails(ADLT.genRandomUserId());

//  3. Define the result handler
  var onSucc = function () {
    log.debug("Connected. Disabling connect button and enabling the disconnect");
    $('#disconnectBtn').click(ADLT.disconnect).removeClass('disabled');
    $('#localUserIdLbl').html(connDescriptor.token);
  };

//  4. Define the error handler
  var onErr = function (errCode, errMessage) {
    log.error("Failed to establish the connection due to: " + errMessage +
        '(err code: ' + errCode + ')');
//    Enable the connect button again
    $('#connectBtn').click(ADLT.connect).removeClass('disabled');
  };

//  5. Request the SDK to establish the connection
  ADL.getService().connect(ADL.createResponder(onSucc, onErr), connDescriptor);
};

ADLT.disconnect = function () {
  log.debug("Terminating the connection");

//  1. Define the result handler
  var onSucc = function () {
    log.debug("Connection terminated");
    $('#connectBtn').click(ADLT.connect).removeClass('disabled');
    $('#disconnectBtn').unbind('click').addClass('disabled');
    $('#renderRemoteUser').empty();
    $('#remoteUserIdLbl').html('undefined');
    $('#localUserIdLbl').html('undefined');
  };

//  2. Request the SDK to terminate the connection.
  ADL.getService().disconnect(ADL.createResponder(onSucc), ADLT.SCOPE_ID);
};

/**
 * Generates sample authentication details. For more info about authentication,
 * please refer to: http://www.addlive.com/docs.html#authentication
 * @param userId
 *        Id of user to authenticate connection for
 * @return {Object}
 *        Generated authentication details object.
 */
ADLT.genAuthDetails = function (userId) {

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
          ADLT.SCOPE_ID +
          userId +
          authDetails.salt +
          authDetails.expires +
          ADLT.APP_SHARED_SECRET;
  authDetails.signature =
      CryptoJS.SHA256(signatureBody).toString(CryptoJS.enc.Hex).toUpperCase();
  return authDetails;
};


/**
 * Register the document ready handler.
 */
$(ADLT.onDomReady);

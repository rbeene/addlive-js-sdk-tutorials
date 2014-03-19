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
  // To set your own SCOPE_ID (check shared-assets/scripts.js)
  var SCOPE_ID = ADLT.SCOPE_ID;

  // To set your own APP_ID (check shared-assets/scripts.js)
  var APPLICATION_ID = ADLT.APP_ID;

  // To set your own API_KEY (check shared-assets/scripts.js)
  var APP_SHARED_SECRET = ADLT.API_KEY;

  /**
   * Document ready callback - starts the AddLive platform initialization.
   */
  function onDomReady() {
    console.log('DOM loaded');

    // assuming the initAddLiveLogging and initDevicesSelects are exposed
    // via ADLT namespace. check shared-assets/scripts.js)
    ADLT.initAddLiveLogging();
    ADLT.initDevicesSelects();
    var initOptions = {applicationId:APPLICATION_ID};
    // Initializes the AddLive SDK. Please refer to ../shared-assets/scripts.js
    ADLT.initializeAddLiveQuick(onPlatformReady, initOptions);
  }

  function onPlatformReady() {
    console.log('AddLive Platform ready.');

    // assuming the populateDevicesQuick is exposed via ADLT namespace.
    // (check shared-assets/scripts.js)
    ADLT.populateDevicesQuick();
    startLocalVideo();
    initServiceListener();
  }

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

        // Add it'S row in the audio stats table
        var audioRow = '<tr id="audio'+e.userId+'"><td>'+e.userId+'</td><td id="audioCPL'+e.userId+'">0</td><td id="audioD'+e.userId+'">0</td><td id="audioFL'+e.userId+'">0</td><td id="audioIJ'+e.userId+'">0</td><td id="audioNBPS'+e.userId+'">0</td><td id="audioRTT'+e.userId+'">0</td><td id="audioSSRC'+e.userId+'">0</td></tr>';
        $('#audioTable').append(audioRow);

        // Add it'S row in the video stats table
        var videoRow = '<tr id="video'+e.userId+'"><td>'+e.userId+'</td><td id="videoCPU'+e.userId+'">0</td><td id="videoCPL'+e.userId+'">0</td><td id="videoD'+e.userId+'">0</td><td id="videoFPS'+e.userId+'">0</td><td id="videoFL'+e.userId+'">0</td><td id="videoIJ'+e.userId+'">0</td><td id="videoNBPS'+e.userId+'">0</td><td id="videoPT'+e.userId+'">0</td><td id="videoPSNR'+e.userId+'">0</td><td id="videoQ'+e.userId+'">0</td><td id="videoQD'+e.userId+'">0</td><td id="videoRTT'+e.userId+'">0</td><td id="videoSSRC'+e.userId+'">0</td></tr>';
        $('#videoTable').append(videoRow);

      } else {
        // Remove the audio stats row
        $('#audio'+e.userId).remove();

        // Remove the video stats row
        $('#video'+e.userId).remove();

        $('#renderRemoteUser').empty();
        $('#remoteUserIdLbl').html('undefined');
      }

    };

    //3. Define the handler for media stats
    /**
     * Reports availability of new video stream statistics.
     * @param {ADL.MediaStatsEvent} e
     */
    listener.onMediaStats = function (e) {

      if(e.mediaType == ADL.MediaType.AUDIO) {

        $('#audioCPL'+e.stats.userId).html(e.stats.cumulativePacketLoss);
        $('#audioD'+e.stats.userId).html(e.stats.direction);
        $('#audioFL'+e.stats.userId).html(e.stats.fractionLoss);
        $('#audioIJ'+e.stats.userId).html(e.stats.interarrivalJitter);
        $('#audioNBPS'+e.stats.userId).html(e.stats.netBps);
        $('#audioRTT'+e.stats.userId).html(e.stats.rtt);
        $('#audioSSRC'+e.stats.userId).html(e.stats.ssrc);

      } else if(e.mediaType == ADL.MediaType.VIDEO) {

        $('#videoCPU'+e.stats.userId).html(e.stats.cpu);
        $('#videoCPL'+e.stats.userId).html(e.stats.cumulativePacketLoss);
        $('#videoD'+e.stats.userId).html(e.stats.direction);
        $('#videoFPS'+e.stats.userId).html(e.stats.fps);
        $('#videoFL'+e.stats.userId).html(e.stats.fractionLoss);
        $('#videoIJ'+e.stats.userId).html(e.stats.interarrivalJitter);
        $('#videoNBPS'+e.stats.userId).html(e.stats.netBps);
        $('#videoPT'+e.stats.userId).html(e.stats.processingTime);
        $('#videoPSNR'+e.stats.userId).html(e.stats.psnr);
        $('#videoQ'+e.stats.userId).html(e.stats.quality);
        $('#videoQD'+e.stats.userId).html(e.stats.queueDelay);
        $('#videoRTT'+e.stats.userId).html(e.stats.rtt);
        $('#videoSSRC'+e.stats.userId).html(e.stats.ssrc);

      }
    };

    //4. Define result handler that will enable the connect button
    var onSucc = function () {
      $('#connectBtn').click(connect).removeClass('disabled');
    };

    //5. Register the listener using created instance and prepared result handler.
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
    connDescriptor.authDetails = genAuthDetails(ADLT.genRandomUserId());

    //3. Define the result handler
    var onSucc = function () {
      console.log('Connected. Disabling connect button and enabling the disconnect');
      $('#disconnectBtn').click(disconnect).removeClass('disabled');
      $('#localUserIdLbl').html(connDescriptor.token);

      // Once connected enable the stats
      ADL.getService().startMeasuringStatistics(ADL.r(), SCOPE_ID, 2.0);
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

      $("tr[id^=audio]").each(function(){

        // Remove the audio remote stats of any remote user.
        if(this.id != "audio-1"){
          $(this).remove();
        }
      });

      $("tr[id^=video]").each(function(){

        // Remove the video remote stats of any remote user.
        if(this.id != "video-1"){
          $(this).remove();
        }
      });

      $("td[id$=-1]").each(function(){

        // Restart to zero the local stats.
        $(this).html(0);
      });

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
  function genAuthDetails(userId) {

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
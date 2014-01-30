/**
 * @fileoverview
 * @TODO file description
 *
 * @author Tadeusz Kozak
 * @date 26-06-2012 13:23
 */

/**
 * @namespace Namespace for all AddLive tutorials definitions.
 */
var ADLT = ADLT || {};

ADLT.SCOPE_ID = 'MOmJ'; // Put your scope here;

ADLT.APP_ID = '486'; // Put your app Id here;

ADLT.API_KEY = 'ADL_M0QLrBEfSMR4w3cb2kwZtKgPumKGkbozk2k4SaHgqaOabexm8OmZ5uM'; // Put your API key here;

(function (w) {
  'use strict';
// Initialize the logging.

  function _nop() {
  }


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
   * @const
   * @type {String}
   */
  ADLT.PLUGIN_CONTAINER_ID = 'pluginContainer';


  ADLT.initAddLiveLogging = function () {
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
  ADLT.initializeAddLiveQuick = function (completeHandler, options) {
    ADLT.initAddLiveLogging();
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


  ADLT.initDevicesSelects = function () {
    $('#camSelect').change(ADLT.getDevChangedHandler('VideoCapture'));
    $('#micSelect').change(ADLT.getDevChangedHandler('AudioCapture'));
    $('#spkSelect').change(ADLT.getDevChangedHandler('AudioOutput'));
  };

  ADLT.getDevChangedHandler = function (devType) {
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
  ADLT.populateDevicesQuick = function () {
    ADLT.populateDevicesOfType('#camSelect', 'VideoCapture');
    ADLT.populateDevicesOfType('#micSelect', 'AudioCapture');
    ADLT.populateDevicesOfType('#spkSelect', 'AudioOutput');
  };

  /**
   * Fills the audio output devices select.
   */
  ADLT.populateDevicesOfType = function (selectSelector, devType) {
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

  ADLT.genRandomUserId = function () {
    return Math.floor(Math.random() * 10000);
  };

  ADLT.randomString = function (len, charSet) {
    charSet = charSet ||
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var str = '';
    for (var i = 0; i < len; i++) {
      var randomPoz = Math.floor(Math.random() * charSet.length);
      str += charSet.substring(randomPoz, randomPoz + 1);
    }
    return str;
  };


  /**
   * Generates sample authentication details. For more info about authentication,
   * please refer to: http://www.addlive.com/docs.html#authentication
   */
  ADLT.genAuth = function (scopeId, userId, appId, appSecret) {

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
        appId +
            scopeId +
            userId +
            authDetails.salt +
            authDetails.expires +
            appSecret;
    authDetails.signature =
        w.CryptoJS.SHA256(signatureBody).toString(w.CryptoJS.enc.Hex).toUpperCase();
    return authDetails;
  };


})(window);

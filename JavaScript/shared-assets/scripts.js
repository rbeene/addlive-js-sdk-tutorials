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

// Initialize the logging.
ADLT.log = log4javascript.getLogger();
window.log = ADLT.log;
ADLT.inPageAppender = new log4javascript.InPageAppender("logsContainer");
ADLT.inPageAppender.setHeight("500px");
ADLT.log.addAppender(ADLT.inPageAppender);

/**
 * @const
 * @type {String}
 */
ADLT.PLUGIN_CONTAINER_ID = 'pluginContainer';


ADLT.initAddLiveLogging = function () {
  ADL.initLogging(function (lev, msg) {
    switch (lev) {
      case ADL.LogLevel.DEBUG:
        ADLT.log.debug("[ADL] " + msg);
        break;
      case ADL.LogLevel.WARN:
        ADLT.log.warn("[ADL] " + msg);
        break;
      case ADL.LogLevel.ERROR:
        ADLT.log.error("[ADL] " + msg);
        break;
      default:
        ADLT.log.error("Got unsupported log level: " + lev + ". Message: " +
            msg);
    }
  }, true);
};

/**
 * Initializes the AddLive SDK.
 */
ADLT.initializeAddLiveQuick = function (completeHandler, options) {
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
  return Math.floor(Math.random() * 10000)
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
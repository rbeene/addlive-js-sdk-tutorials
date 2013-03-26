/**
 * @fileoverview
 * @TODO file description
 *
 * @author Tadeusz Kozak
 * @date 26-06-2012 10:37
 */

(function (w) {
  'use strict';
  var ADLT = w.ADLT,
      log = ADLT.log;

  /**
   * Document ready callback - starts the AddLive platform initialization.
   */
  ADLT.onDomReady = function () {
    log.debug('DOM loaded');
    ADLT.initUI();
    ADLT.initAddLiveLogging();
    ADLT.initializeAddLiveQuick(ADLT.populateDevices);
  };

  /**
   * Initializes the UI components, by binding to the change events of the selects
   * provided by the UI.
   */
  ADLT.initUI = function () {
    $('#camSelect').change(ADLT.onCamSelected);
    $('#micSelect').change(ADLT.onMicSelected);
    $('#spkSelect').change(ADLT.onSpkSelected);
  };

  /**
   * Fills the selects with the currently plugged in devices.
   */
  ADLT.populateDevices = function () {
    ADLT.populateVideoCaptureDevices();
    ADLT.populateAudioCaptureDevices();
    ADLT.populateAudioOutputDevices();
  };

  /**
   * Fills the audio output devices select.
   */
  ADLT.populateAudioOutputDevices = function () {
//  Step 1. Define the speakers list result handler
    var spkrsResultHandler = function (devs) {
      var $select = $('#spkSelect');
//    1. Clear the select to remove the "Loading..." item
      $select.empty();

//    2. Fill the select with options corresponding to the devices returned by
//       the AddLive SDK
      $.each(devs, function (devId, devLabel) {
        $('<option value="' + devId + '">' + devLabel + '</option>').
            appendTo($select);
      });

//    3. Create the result handler that sets the currently used device
      var getDeviceHandler = function (device) {
        $select.val(device);
      };

//    4. Get the currently used speakers
      ADL.getService().getAudioOutputDevice(
          ADL.createResponder(getDeviceHandler));
    };

//  Step 0. Get all the devices
    ADL.getService().getAudioOutputDeviceNames(
        ADL.createResponder(spkrsResultHandler));
  };

  /**
   * Fills the audio capture devices select.
   */
  ADLT.populateAudioCaptureDevices = function () {
    var micsResultHandler = function (devs) {
      var $select = $('#micSelect');
      $select.empty();
      $.each(devs, function (devId, devLabel) {
        $('<option value="' + devId + '">' + devLabel + '</option>').
            appendTo($select);
      });
      var getDeviceHandler = function (device) {
        $select.val(device);
      };
      ADL.getService().getAudioCaptureDevice(
          ADL.createResponder(getDeviceHandler));
    };
    ADL.getService().getAudioCaptureDeviceNames(
        ADL.createResponder(micsResultHandler));
  };

  /**
   * Fills the video capture devices select.
   */
  ADLT.populateVideoCaptureDevices = function () {
    var webcamsResultHandler = function (devs) {
      var $select = $('#camSelect');
      $select.empty();
      $.each(devs, function (devId, devLabel) {
        $('<option value="' + devId + '">' + devLabel + '</option>').
            appendTo($select);
      });
      var getDeviceHandler = function (device) {
        $select.val(device);
      };
      ADL.getService().getVideoCaptureDevice(
          ADL.createResponder(getDeviceHandler));
    };
    ADL.getService().getVideoCaptureDeviceNames(
        ADL.createResponder(webcamsResultHandler));
  };

  /**
   * Handles the change event of the video capture devices select.
   */
  ADLT.onCamSelected = function () {
    var selected = $(this).val();
    ADL.getService().setVideoCaptureDevice(ADL.createResponder(), selected);
  };

  /**
   * Handles the change event of the audio capture devices select.
   */
  ADLT.onMicSelected = function () {
    var selected = $(this).val();
    ADL.getService().setAudioCaptureDevice(ADL.createResponder(), selected);
  };

  /**
   * Handles the change event of the audio output devices select.
   */
  ADLT.onSpkSelected = function () {
    var selected = $(this).val();
    ADL.getService().setAudioOutputDevice(ADL.createResponder(), selected);
  };


  /**
   * Register the document ready handler.
   */
  $(ADLT.onDomReady);
})(window);
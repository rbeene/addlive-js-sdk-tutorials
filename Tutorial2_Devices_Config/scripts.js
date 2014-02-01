/**
 * @fileoverview
 * @TODO file description
 *
 * @author Tadeusz Kozak
 * @date 26-06-2012 10:37
 */

(function () {
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
   * Document ready callback - starts the AddLive platform initialization.
   */
  function onDomReady() {
    console.log('DOM loaded');
    initUI();
    // assuming the initAddLiveLogging is exposed
    // via ADLT namespace. (check shared-assets/scripts.js)
    ADLT.initAddLiveLogging();
    // Initializes the AddLive SDK.
    initializeAddLive();
  }

  /**
   * Initializes the AddLive SDK.
   */
  function initializeAddLive() {
    console.log("Initializing the AddLive SDK");

    // Step 1 - create the PlatformInitListener and overwrite it's methods.
    var initListener = new ADL.PlatformInitListener();

    // Define the handler for initialization state changes
    initListener.onInitStateChanged = function (e) {
      switch (e.state) {

        case ADL.InitState.ERROR:
          // After receiving this status, the initialization is stopped as
          // due tutorial a failure.
          console.error("Failed to initialize the AddLive SDK");
          console.error("Reason: " + e.errMessage + ' (' + e.errCode + ')');
          break;

        case ADL.InitState.INITIALIZED:
          //This state flag indicates that the AddLive SDK is initialized and fully
          //functional.
          console.log("AddLive SDK fully functional");
          populateDevices();
          break;

        case ADL.InitState.INSTALLATION_REQUIRED:
          // Current user doesn't have the AddLive Plug-In installed and it is
          // required - use provided URL to ask the user to install the Plug-in.
          // Note that the initialization process is just frozen in this state -
          // the SDK polls for plug-in availability and when it becomes available,
          // continues with the initialization.
          console.log("AddLive Plug-in installation required");
          $('#installBtn').attr('href', e.installerURL).css('display', 'block');
          break;
        case ADL.InitState.INSTALLATION_COMPLETE:
          console.log("AddLive Plug-in installation complete");
          $('#installBtn').hide();
          break;

        case ADL.InitState.BROWSER_RESTART_REQUIRED:
          // This state indicates that AddLive SDK performed auto-update and in
          // order to accomplish this process, browser needs to be restarted.
          console.log("Please restart your browser in order to complete platform auto-update");
          break;

        case ADL.InitState.DEVICES_INIT_BEGIN:
          // This state indicates that AddLive SDK performed auto-update and
          // in order to accomplish this process, browser needs to be restarted.
          console.log("Devices initialization started");
          break;

        default:
          // Default handler, just for sanity
          console.log("Got unsupported init state: " + e.state);
      }
    };

    // Step 2. Actually trigger the asynchronous initialization of the AddLive SDK.
    ADL.initPlatform(initListener, {applicationId:1});
  }

  /**
   * Initializes the UI components, by binding to the change events of the selects
   * provided by the UI.
   */
  function initUI () {
    $('#camSelect').change(onCamSelected);
    $('#micSelect').change(onMicSelected);
    $('#spkSelect').change(onSpkSelected);
  }

  /**
   * Fills the selects with the currently plugged in devices.
   */
  function populateDevices () {
    populateVideoCaptureDevices();
    populateAudioCaptureDevices();
    populateAudioOutputDevices();
  }

  /**
   * Fills the audio output devices select.
   */
  function populateAudioOutputDevices () {
    // Step 1. Define the speakers list result handler
    var spkrsResultHandler = function (devs) {
      var $select = $('#spkSelect');
      // 1. Clear the select to remove the "Loading..." item
      $select.empty();

      // 2. Fill the select with options corresponding to the devices returned by
      // the AddLive SDK
      $.each(devs, function (devId, devLabel) {
        $('<option value="' + devId + '">' + devLabel + '</option>').
            appendTo($select);
      });

      // 3. Create the result handler that sets the currently used device
      var getDeviceHandler = function (device) {
        $select.val(device);
      };

      // 4. Get the currently used speakers
      ADL.getService().getAudioOutputDevice(
          ADL.createResponder(getDeviceHandler));
    };

    // Step 0. Get all the devices
    ADL.getService().getAudioOutputDeviceNames(
        ADL.createResponder(spkrsResultHandler));
  }

  /**
   * Fills the audio capture devices select.
   */
  function populateAudioCaptureDevices () {
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
  }

  /**
   * Fills the video capture devices select.
   */
  function populateVideoCaptureDevices () {
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
  }

  /**
   * Handles the change event of the video capture devices select.
   */
  function onCamSelected () {
    var selected = $(this).val();
    ADL.getService().setVideoCaptureDevice(ADL.createResponder(), selected);
  }

  /**
   * Handles the change event of the audio capture devices select.
   */
  function onMicSelected () {
    var selected = $(this).val();
    ADL.getService().setAudioCaptureDevice(ADL.createResponder(), selected);
  }

  /**
   * Handles the change event of the audio output devices select.
   */
  function onSpkSelected () {
    var selected = $(this).val();
    ADL.getService().setAudioOutputDevice(ADL.createResponder(), selected);
  }

  /**
   * Register the document ready handler.
   */
  $(onDomReady);
})();
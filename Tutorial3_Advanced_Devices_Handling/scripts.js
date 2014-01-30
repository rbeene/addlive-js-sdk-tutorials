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
  function onDomReady () {
    console.log('DOM loaded');

    // assuming the initDevicesSelects is exposed via ADLT namespace.
    // (check shared-assets/scripts.js)
    ADLT.initDevicesSelects();

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
          onPlatformReady();
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


  function initUI () {
    $('#volumeCtrlSlider').slider({
      min:0,
      max:255,
      animate:true,
      value:127,
      slide:onVolumeSlide
    });
    $('#micGainCtrlSlider').slider({
      min:0,
      max:255,
      animate:true,
      value:127,
      slide:onMicGainSlide
    });
    $('#micActivityBar').progressbar({value:50});
    $('#playTestSoundBtn').click(onPlayTestSoundBtnClicked);
    $('#micActivityEnabledChckbx').change(onMicActivityEnabledChckbxChange);
  }


  function onPlatformReady () {
    initializeListener();

    // assuming the populateDevicesQuick is exposed via ADLT namespace.
    // (check shared-assets/scripts.js)
    ADLT.populateDevicesQuick();

    populateVolume();
    populateMicGain();
    $('#playTestSoundBtn').
        click(onPlayTestSoundBtnClicked).
        removeClass('disabled');
  }

  function initializeListener () {
    var listener = new ADL.AddLiveServiceListener();
    listener.onDeviceListChanged = function (e) {
      console.log("Got devices list changed");
      if (e.audioInChanged) {
        console.log("Got new microphone plugged in");
        // assuming the populateDevicesOfType is exposed via ADLT namespace.
        // (check shared-assets/scripts.js)
        ADLT.populateDevicesOfType('#micSelect', 'AudioCapture');
      }
      if (e.audioOutChanged) {
        console.log("Got new speakers plugged in");
        // assuming the populateDevicesOfType is exposed via ADLT namespace.
        // (check shared-assets/scripts.js)
        ADLT.populateDevicesOfType('#spkSelect', 'AudioOutput');
      }
      if (e.videoInChanged) {
        console.log("Got new camera plugged in");
        // assuming the populateDevicesOfType is exposed via ADLT namespace.
        // (check shared-assets/scripts.js)
        ADLT.populateDevicesOfType('#camSelect', 'VideoCapture');
      }
    };

    listener.onMicActivity = function (e) {
      console.log("Got mic activity: " + e.activity);
      $('#micActivityBar').progressbar('value', e.activity / 255 * 100);
    };

    ADL.getService().addServiceListener(ADL.createResponder(), listener);
  }

  function populateVolume () {
    var resultHandler = function (volume) {
      $('#volumeCtrlSlider').slider('value', volume);
    };
    ADL.getService().getSpeakersVolume(ADL.createResponder(resultHandler));
  }

  function populateMicGain () {
    var resultHandler = function (volume) {
      $('#micGainCtrlSlider').slider('value', volume);
    };
    ADL.getService().getMicrophoneVolume(ADL.createResponder(resultHandler));
  }

  function onVolumeSlide (e, ui) {
    ADL.getService().setSpeakersVolume(ADL.createResponder(), ui.value);
  }

  function onMicGainSlide (e, ui) {
    ADL.getService().setMicrophoneVolume(ADL.createResponder(), ui.value);
  }

  function onPlayTestSoundBtnClicked () {
    ADL.getService().startPlayingTestSound(ADL.createResponder());
  }

  function onMicActivityEnabledChckbxChange () {
    var enabled = $(this).is(':checked');
    ADL.getService().monitorMicActivity(ADL.createResponder(), enabled);
  }

  /**
   * Register the document ready handler.
   */
  $(onDomReady);
})();
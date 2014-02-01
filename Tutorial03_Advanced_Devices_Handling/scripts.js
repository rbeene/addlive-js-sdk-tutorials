/**
 * @fileoverview
 * @TODO file description
 *
 * @author Tadeusz Kozak
 * @date 26-06-2012 10:37
 */
(function () {
  'use strict';

  /**
   * Document ready callback - starts the AddLive platform initialization.
   */
  function onDomReady() {
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
    ADLT.initializeAddLiveQuick(onPlatformReady,
        {applicationId:ADLT.APP_ID});
  }


  function initUI() {
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


  function onPlatformReady() {
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

  function initializeListener() {
    var listener = new ADL.AddLiveServiceListener();
    listener.onDeviceListChanged = function (e) {
      console.log('Got devices list changed');
      if (e.audioInChanged) {
        console.log('Got new microphone plugged in');
        // assuming the populateDevicesOfType is exposed via ADLT namespace.
        // (check shared-assets/scripts.js)
        ADLT.populateDevicesOfType('#micSelect', 'AudioCapture');
      }
      if (e.audioOutChanged) {
        console.log('Got new speakers plugged in');
        // assuming the populateDevicesOfType is exposed via ADLT namespace.
        // (check shared-assets/scripts.js)
        ADLT.populateDevicesOfType('#spkSelect', 'AudioOutput');
      }
      if (e.videoInChanged) {
        console.log('Got new camera plugged in');
        // assuming the populateDevicesOfType is exposed via ADLT namespace.
        // (check shared-assets/scripts.js)
        ADLT.populateDevicesOfType('#camSelect', 'VideoCapture');
      }
    };

    listener.onMicActivity = function (e) {
      console.log('Got mic activity: ' + e.activity);
      $('#micActivityBar').progressbar('value', e.activity / 255 * 100);
    };

    ADL.getService().addServiceListener(ADL.createResponder(), listener);
  }

  function populateVolume() {
    var resultHandler = function (volume) {
      $('#volumeCtrlSlider').slider('value', volume);
    };
    ADL.getService().getSpeakersVolume(ADL.createResponder(resultHandler));
  }

  function populateMicGain() {
    var resultHandler = function (volume) {
      $('#micGainCtrlSlider').slider('value', volume);
    };
    ADL.getService().getMicrophoneVolume(ADL.createResponder(resultHandler));
  }

  function onVolumeSlide(e, ui) {
    ADL.getService().setSpeakersVolume(ADL.createResponder(), ui.value);
  }

  function onMicGainSlide(e, ui) {
    ADL.getService().setMicrophoneVolume(ADL.createResponder(), ui.value);
  }

  function onPlayTestSoundBtnClicked() {
    ADL.getService().startPlayingTestSound(ADL.createResponder());
  }

  function onMicActivityEnabledChckbxChange() {
    var enabled = $(this).is(':checked');
    ADL.getService().monitorMicActivity(ADL.createResponder(), enabled);
  }

  /**
   * Register the document ready handler.
   */
  $(onDomReady);
})();
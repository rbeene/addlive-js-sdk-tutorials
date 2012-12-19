/**
 * @fileoverview
 * @TODO file description
 *
 * @author Tadeusz Kozak
 * @date 26-06-2012 10:37
 */


/**
 * Document ready callback - starts the AddLive platform initialization.
 */
ADLT.onDomReady = function () {
  log.debug('DOM loaded');
  ADLT.initDevicesSelects();
  ADLT.initUI();
  ADLT.initAddLiveLogging();
  ADLT.initializeAddLiveQuick(ADLT.onPlatformReady);
};


ADLT.initUI = function () {
  $('#volumeCtrlSlider').slider({
    min:0,
    max:255,
    animate:true,
    value:127,
    slide:ADLT.onVolumeSlide
  });
  $('#micGainCtrlSlider').slider({
    min:0,
    max:255,
    animate:true,
    value:127,
    slide:ADLT.onMicGainSlide
  });
  $('#micActivityBar').progressbar({value:50});
  $('#playTestSoundBtn').click(ADLT.onPlayTestSoundBtnClicked);
  $('#micActivityEnabledChckbx').change(ADLT.onMicActivityEnabledChckbxChange);
};


ADLT.onPlatformReady = function () {
  ADLT.initializeListener();
  ADLT.populateDevicesQuick();
  ADLT.populateVolume();
  ADLT.populateMicGain();
  $('#playTestSoundBtn').
      click(ADLT.onPlayTestSoundBtnClicked).
      removeClass('disabled');
};

ADLT.initializeListener = function () {
  var listener = new ADL.AddLiveServiceListener();
  listener.onDeviceListChanged = function (e) {
    log.debug("Got devices list changed");
    if (e.audioInChanged) {
      log.debug("Got new microphone plugged in");
      ADLT.populateDevicesOfType('#micSelect', 'AudioCapture');
    }
    if (e.audioOutChanged) {
      log.debug("Got new speakers plugged in");
      ADLT.populateDevicesOfType('#spkSelect', 'AudioOutput');
    }
    if (e.videoInChanged) {
      log.debug("Got new camera plugged in");
      ADLT.populateDevicesOfType('#camSelect', 'VideoCapture');
    }
  };

  listener.onMicActivity = function (e) {
    log.debug("Got mic activity: " + e.activity);
    $('#micActivityBar').progressbar('value', e.activity / 255 * 100);
  };

  var listener2 = new ADL.AddLiveServiceListener();
  listener2.onMicActivity = function (e) {
    log.debug("Got mic activity on 2nd listener: " + e.activity);
  };

  ADL.getService().addServiceListener(ADL.createResponder(), listener2);
  ADL.getService().addServiceListener(ADL.createResponder(), listener);
};

ADLT.populateVolume = function () {
  var resultHandler = function (volume) {
    $('#volumeCtrlSlider').slider('value', volume);
  };
  ADL.getService().getSpeakersVolume(ADL.createResponder(resultHandler));
};

ADLT.populateMicGain = function () {
  var resultHandler = function (volume) {
    $('#micGainCtrlSlider').slider('value', volume);
  };
  ADL.getService().getMicrophoneVolume(ADL.createResponder(resultHandler));
};

ADLT.onVolumeSlide = function (e, ui) {
  ADL.getService().setSpeakersVolume(ADL.createResponder(), ui.value);
};

ADLT.onMicGainSlide = function (e, ui) {
  ADL.getService().setMicrophoneVolume(ADL.createResponder(), ui.value);
};

ADLT.onPlayTestSoundBtnClicked = function () {
  ADL.getService().startPlayingTestSound(ADL.createResponder());
};

ADLT.onMicActivityEnabledChckbxChange = function () {
  var enabled = $(this).is(':checked');
  ADL.getService().monitorMicActivity(ADL.createResponder(), enabled);
};

/**
 * Register the document ready handler.
 */
$(ADLT.onDomReady);

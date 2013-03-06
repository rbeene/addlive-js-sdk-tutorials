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
  ADLT.initAddLiveLogging();
  ADLT.initDevicesSelects();
  ADLT.initializeAddLiveQuick(ADLT.onPlatformReady);
};

ADLT.onPlatformReady = function () {
  ADLT.populateDevicesOfType('#camSelect', 'VideoCapture');
  ADLT.startLocalVideo();
};

ADLT.startLocalVideo = function () {
  var resultHandler = function (sinkId) {
    log.debug("Local preview started. Rendering the sink with id: " + sinkId);
    ADL.renderSink({
      sinkId:sinkId,
      containerId:'renderContainer'
    });

    ADL.renderSink({
      sinkId:sinkId,
      containerId:'renderContainerWindowed',
      windowless:false
    });


    ADL.renderSink({
      sinkId:sinkId,
      containerId:'renderContainerMirror',
      mirror:true
    });

    ADL.renderSink({
      sinkId:sinkId,
      containerId:'renderContainerBicubic',
      filterType:ADL.VideoScalingFilter.BICUBIC
    });
  };
  ADL.getService().startLocalVideo(ADL.createResponder(resultHandler));
};

/**
 * Register the document ready handler.
 */
$(ADLT.onDomReady);

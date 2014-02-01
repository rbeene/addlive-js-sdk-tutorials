/**
 * @fileoverview
 *
 * Contains implementation of logic required by the Tutorial 1.
 *
 * @author Tadeusz Kozak
 * @date 26-06-2012 10:37
 */


(function (w) {
  'use strict';
  var ADLT = w.ADLT;

  /**
   * Document ready callback - starts the AddLive platform initialization.
   */
  ADLT.onDomReady = function () {
    console.log('DOM loaded');
    $('#initProgressBar').
        progressbar({
          value:0
        });
    ADLT.initAddLiveLogging();
    $('#initBtn').one('click', initPlatform);
  };

  function initPlatform() {
    console.log('Initializing the AddLive SDK');

    $('#initBtn').addClass('disabled');
    var initOptions = {applicationId:ADLT.APP_ID},
        onPlatformReady = function () {
          var getVersionResult = function (version) {
            console.log('AddLive service version: ' + version);
            $('#sdkVersion').html(version);
          };

          var responder = ADL.createResponder(getVersionResult);
          ADL.getService().getVersion(responder);
          $('#disposeBtn').one('click', disposePlatform).removeClass('disabled');
        };
    ADLT.initializeAddLiveQuick(onPlatformReady, initOptions);
  }

  function disposePlatform() {
    ADL.disposePlatform();
    $('#initBtn').one('click', initPlatform).removeClass('disabled');
    $('#disposeBtn').addClass('disabled');
    $('#initProgressBar').progressbar('value', 0);

  }


  /**
   * Register the document ready handler.
   */
  $(ADLT.onDomReady);

})(window);
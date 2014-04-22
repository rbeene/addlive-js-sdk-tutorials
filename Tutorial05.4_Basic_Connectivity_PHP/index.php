<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8"/>
    <meta http-equiv="Content-Language" content="en"/>
    <meta name="google" content="notranslate">

    <?php require 'main.php'; ?>

    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"
        type="text/javascript"></script>

    <script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.10.0/jquery-ui.min.js"
        type="text/javascript"></script>

    <script type="text/javascript"
        src='js/tutorial_scripts.js'></script>

    <script type="text/javascript"
        src="//d36pfzlm4aixmv.cloudfront.net/stable_v3/addlive-sdk.js"></script>

    <script type="text/javascript">
        $(function () {
            ADLT.APP_ID = '<?php echo $APP_ID; ?>';
            ADLT.API_KEY = '<?php echo $API_KEY; ?>';
            ADLT.SCOPE_ID = '<?php echo $SCOPE_ID; ?>';
            ADLT.AUTH_DETAILS = '<?php echo json_encode($AUTH_DETAILS); ?>';
            ADLT.init();
        });
    </script>

    <title>Basic Connectivity with PHP</title>

    <link rel="stylesheet"
        href='css/bootstrap.css'>

    <link rel="stylesheet"
        href='css/style.css'>

    <link rel="stylesheet"
        href='css/jquery-ui-bootstrap/jquery-ui-1.10.0.custom.css'>
</head>
<body>
    <div id="bodyWrapper">
        <div class="header">
            <h1>Basic Connectivity with PHP</h1>
        </div>
        <div class="main">
            <a id="installBtn" href="#" class="btn btn-primary">Install AddLive
            Plug-in</a>

            <!-- Beginning of the video feeds rendering section -->
            <div class="rendering-wrapper">
                <div class="render-widget">
                    <div>
                        Local preview (user id: <span id="localUserIdLbl">undefined</span>)
                    </div>
                    <div id="renderLocalPreview" class="render-wrapper"></div>
                </div>

                <div class="render-widget">
                    <div>
                        Remote user (user id: <span id="remoteUserIdLbl">undefined</span>)
                    </div>
                    <div id="renderRemoteUser" class="render-wrapper"></div>
                </div>
                <div class="clearer"></div>
            </div>
            <!-- End of the video feeds rendering section -->

            <!-- Beginning of the user controls section -->
            <div id="tut4CtrlWrapper" class="controls-wrapper">
                <div class="controls-wrapper">
                    <!--Connect disconnect buttons -->
                    <div class="ctrl-wrapper">
                        <a id="connectBtn" href="javascript://nop"
                            class="btn btn-primary disabled">Connect</a>
                        <a id="disconnectBtn" href="javascript://nop"
                            class="btn btn-danger disabled">Disconnect</a>
                    </div>

                    <!--Video capture device configuration -->
                    <div class="ctrl-wrapper">
                        <label for="camSelect">Video Capture device:</label>
                        <select id="camSelect" class="ctrl">
                            <option value="-1">Loading...</option>
                        </select>

                        <div class="clearer"></div>
                    </div>

                    <!--Audio capture device configuration -->
                    <div class="ctrl-wrapper">
                        <label for="micSelect">Audio Capture device:</label>
                        <select id="micSelect" class="ctrl">
                            <option value="-1">Loading...</option>
                        </select>

                        <div class="clearer"></div>
                    </div>

                    <!--Audio output device configuration -->
                    <div class="ctrl-wrapper">
                        <label for="spkSelect">Audio Output device:</label>
                        <select id="spkSelect" class="ctrl">
                            <option value="-1">Loading...</option>
                        </select>

                        <div class="clearer"></div>
                    </div>
                </div>
            </div>
          <!-- End of the user controls section -->
        </div>
    </div>
    <div id="footer">
        <div class="container">
            <p class="muted credit">&copy; LiveFoundry Inc. 2013 <a
            href="http://www.addlive.com">www.addlive.com</a></p>
        </div>
    </div>
</body>
</html>

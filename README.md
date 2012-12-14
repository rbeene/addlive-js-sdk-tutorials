AddLive JavaScript SDK Tutorials
================================


This sample project aims at flattening the learning curve of the AddLive SDK.
Each tutorial provided showcases single area of features, using fully functional
(but simple) web application. Read more at http://www.addlive.com.

Please note that all the tutorials use the beta release channel.


Tutorial 1
----------

This tutorial covers the very first step that needs to be done to create AddLive
powered web application - initialization of the AddLive Platform. Within this
tutorial, we will create a sample application that:

- Loads the AddLive SDK.
- Initializes the AddLive Logging (for development purposes).
- Initializes the AddLive Platform.
- Installs the AddLive Plug-in if required.
- Performs sample call to the AddLive Service to obtain it's version.
- Has simple UI showing the initialization progress bar, installation button (if
required) and Platform SDK version.

Tutorial 2
----------

This tutorial covers the basics of multimedia devices configuration - getting the installed devices, getting the device currerntly used by the platform and finally choosing a device.
Within this tutorial, we will create a sample application that:

- Loads the AddLive SDK.
- Initializes the AddLive Logging (for development purposes).
- Initializes the AddLive Platform.
- Requests list of multimedia devices plugged in to user's computer.
- Allows the user to select a device which should be used by the platform.

Tutorial 3
----------

This tutorial covers more advanced devices configuration. We will learn how to control the speakers volume or microphone gain; how to play a sample audio file to check whether the volume level is fine and finally and finally how to render speech level indicator to verify the microphone gain.
Within this tutorial, we will create a sample application that:

- Loads the AddLive SDK.
- Initializes the AddLive Logging (for development purposes).
- Initializes the AddLive Platform.
- Requests list of multimedia devices plugged in to user's computer.
- Allows a user to select devices used by the platform.
- Has a slider allowing a user to change the volume level.
- Has a button allowing a user to play a sample audio file.
- Has a slider allowing a user to change the microphone gain level.
- Has a microphone activity indicator showing the speech level.
- Has a checkbox allowing the user to enable or disable the microphone activity monitoring.
- Monitors for changes in devices plugged in to user's computer.
- Refreshes the devices select when change in devices list is detected.

Tutorial 4
----------

This tutorial covers one of the core AddLive SDK features - video rendering. In
order to understand this tutorial completely, one need to know basic rendering
concepts like a video sink and a renderer.

#### Video sink

Video sink is a source of raw video frames. There are two cases that
trigger video sink creation - it is being created for the local user's preview
when calling the CDO.AddLiveService#startLocalVideo and for remote participants'
video feeds. Additionally, every video sink has a unique id associated to it.

#### Video renderer

Video renderer is an UI component that can display video frames provided
by a video sink. Internally it's just an Object with same mime type as the
AddLive Plug-in, but with a configuration options indicating that it should be
treated as a rendering item rather then platform functionality provider. Each
video sink can have multiple video renderers attached and single renderer is
capable of rendering only one video sink. Video renderer recognizes several
options controlling its behaviour. It can be windowed or windowless (makes
effect only on Microsoft Windows operating system. Under OS X rendering is
always windowless), mirrored or not and finally can use 2 types of scaling
filters: bilinear (less CPU intrusive, worse quality) and bicubic (more CPU
intrusive, better quality).

It is also important to note that the renderer dimensions does not have to match
the ones of the video sink being rendered. A renderer can have arbitrary
dimensions, even with a different aspect ratio then the video sink being
rendered. In such a case, the renderer will scale and crop frames to maintain
the aspect ratio of the source and also desired dimensions. It is a good
practice to render the same source with same aspect ratio on both local and
remote side. In short, a user should see his preview in a same way as will be
seen by the remote participant. The sizes might be different, no problem here.
But using different aspect ratio may cause a rare case when portion of the video
feed expected by the user to be seen by the remote party will be lost due to
cropping.

Within this tutorial, we will create a sample application that:

- Loads the AddLive SDK.
- Initializes the AddLive Logging (for development purposes).
- Initializes the AddLive Platform.
- Starts local user's preview video feed.
- Renders local user's preview video feed using 4 renderers, with different configurations.
- Fetches the list of plugged in video capture devices.
- Allows a user to select a video capture device.

Tutorial 5
----------

About the tutorial

The 5th AddLive tutorial covers the basics of establishing and terminating a
connection to the AddLive Streaming Server. Also we will learn how to handle
user notifications to render video feeds showing remote users.

Within this tutorial, we will create a sample application that:

- Loads the AddLive SDK.
- Initializes the AddLive Logging (for development purposes).
- Initializes the AddLive Platform.
- Starts local user's preview video feed.
- Renders local user's preview video feed.
- Fetches the list of plugged in media devices of all types.
- Allows the user to select media device of any type.
- Allows the user to establish a connection to the AddLive Streaming Server, using fixed scope id.
- Allows the user to terminate previously established connection to the AddLive Streaming Server.
- Renders single remote participants.

Tutorial 6
----------

This tutorial covers implementation of more advanced video conferencing
application and employs all of the connectivity-related features of the AddLive
SDK.

Within this tutorial, we will create a sample application that:

- Loads the AddLive SDK.
- Initializes the AddLive Logging (for development purposes).
- Initializes the AddLive Platform.
- Starts local user's preview video feed.
- Renders local user's preview video feed.
- Fetches the list of plugged in media devices of all types.
- Allows a user to select media device of any type.
- Allows a user to establish a connection to the AddLive Streaming Server, using user-defined scope (aka 'room') id.
- Allows a user to terminate previously established connection to the AddLive Streaming Server.
- Allows a user to start and stop publishing video and audio stream.
- Allows multiple participants to join a room with the same media scope id.
- Shows current type of the media connection.
- Shows the streaming state of every remote participant.
- Tries to reconnect a user in case of connection lost due to Internet connectivity issues.

Tutorial 7
----------

This tutorial shows basics of the sendMessage API, using simple text chat widget
as an example.

Within this tutorial, we will create a sample application that:

- Loads the AddLive SDK.
- Initializes the AddLive Logging (for development purposes).
- Initializes the AddLive Platform.
- provides simple widget allowing one to send message to selected remote peer
  or to broadcast it to all remote peers connected to the same scope

Tutorial 8
----------

The 8th AddLive SDK tutorial provides sample implementation of screen sharing
functionality.

Within this tutorial we've create an application that:

- Loads the AddLive SDK.
- Initializes the AddLive Logging (for development purposes).
- Initializes the AddLive Platform.
- fetches list of possible screen sharing sources
- allows one to refresh this list
- establishes a connection to AddLive Streaming server, with fixed scope id
- publishes selected screen (click to select)
- allows one to change the screen (window) shared (again click to select
  different source)


Tutorial 9
----------

In Tutorial 9 we'll be focusing on user landing process. It provides an example
implementation of a widget that takes the users through all the steps required
to setup the AddLive platform in the browser and also to make sure that the
environment in which user operates allows the platform to function properly.
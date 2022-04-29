﻿using System;
using System.Collections.Generic;
using MMALSharp;
using MMALSharp.Common;
using MMALSharp.Handlers;
using QrCodeDetection;

namespace PiController
{

    class Program
    {
        static int selection = 1; //1 = webcam, 2 = PI camera
        static int visualize = 1; //1 = visualize, 2 = dont visualize
        static int mode = 1; //1 = offline, 2 = online

        private static void loadFlags(string[] args)
        {
            if (args.Length > 0)
                int.TryParse(args[0], out selection);
            if (args.Length > 1)
                int.TryParse(args[1], out visualize);
            if (args.Length > 2)
                int.TryParse(args[2], out mode);
        }

        private async static void testCamera()
        {
            // Singleton initialized lazily. Reference once in your application.
            MMALCamera cam = MMALCamera.Instance;

            using (var imgCaptureHandler = new ImageStreamCaptureHandler("/home/pi/images/", "jpg"))
            {
                await cam.TakePicture(imgCaptureHandler, MMALEncoding.JPEG, MMALEncoding.I420);
            }

            // Cleanup disposes all unmanaged resources and unloads Broadcom library. To be called when no more processing is to be done
            // on the camera.
            cam.Cleanup();
        }

        static void Main(string[] args)
        {
            testCamera();
            return;


            Console.WriteLine("++++++ PREN11 PiController is starting ++++++");
            Console.WriteLine("Using args: " + String.Join(", ", args));

            loadFlags(args);
            var localGuid = Guid.NewGuid();
            Console.WriteLine("Loaded args, setting up run: " + localGuid.ToString());
            Detector detector = null;
            ServerCommunicator serverCommunicator = null;
            try
            {
                detector = new QrCodeDetection.Detector();
                //1. Try and setup connection with all components (server connection, camera test...)
                try
                {
                    serverCommunicator = new ServerCommunicator("https://tactile-rigging-333212.oa.r.appspot.com");
                    detector.Init(visualize == 1);
                    Console.WriteLine("Setting up Server Communicator");

                }
                catch (Exception ex)
                {
                    Console.Error.WriteLine($"Couldn't setup run {localGuid} because of an error: {ex.Message}");
                    Console.Error.WriteLine(ex.StackTrace.ToString());
                    throw ex; // throw so it cleans up run correctly
                }
                Boolean end = false;
                //2. Start Run
                serverCommunicator.SendStart();
                while (end == false)
                {
                    var latestValue = detector.DetectUniqueCode();
                    // process value
                    end = (latestValue.text.Equals("end"));
                    if(end == false && latestValue.text.Contains("plant"))
                    {
                        //send to plantId
                        if (mode == 2) //Online Mode check
                        {
                            Console.WriteLine("Running in Online Mode, preparing to send image to plantId");
                            var imageBytes = latestValue.image.ToBytes();
                            var plantIdResult = PlantIdApiHandler.SendToPlantId(imageBytes);
                            // Send Result to Webserver via socket.io
                            Console.WriteLine("Sending found plant via socket: " + plantIdResult);
                            serverCommunicator.SendPlant(plantIdResult);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Run {localGuid} ended because of an error: {ex.Message}");
                Console.Error.WriteLine(ex.StackTrace.ToString());
                //we could display these errors somewhere
            }
            finally
            {
                Console.WriteLine("Ending Run");
                if(detector != null)
                {
                    detector.Release();
                }
                if(serverCommunicator != null)
                {
                    serverCommunicator.SendEnd();
                }
                Console.ReadKey(); //for debug purpose
                //end run
            }



        }
    }
}
import { defineFeature, loadFeature } from 'jest-cucumber';
const feature = loadFeature('./test/features/webrtcVideo.feature');

defineFeature(feature, (test) => {

   
    test('Agent answers a video call', ({ given, and, when, then }) => {
        given('an incoming WebRTC video call is received', () => {

        });

        and('the agent grants microphone and camera permission', () => {

        });

        when('the agent clicks Answer', () => {

        });

        then('the call should connect with audio and video streams enabled', () => {

        });
    });

 
 })
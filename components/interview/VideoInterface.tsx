// components/interview/VideoInterface.tsx
"use client";

import { useCallback, useEffect, useRef } from "react"; // Added useRef
import {
  DailyProvider,
  useDaily,
  useLocalParticipant,
  useVideoTrack,
  useAudioTrack,
} from "@daily-co/daily-react";
import { Mic, MicOff, Video, VideoOff } from "lucide-react";
import { Button } from "@/components/ui/button";

function ParticipantView() {
  const localParticipant = useLocalParticipant();
  const videoState = useVideoTrack(localParticipant?.session_id || "");
  const audioState = useAudioTrack(localParticipant?.session_id || "");
  const callObject = useDaily();

  const videoEl = useRef<HTMLVideoElement>(null); // Ref for the video element

  // Determine if video/audio is enabled based on isOff
  const isVideoEnabled = !videoState.isOff;
  const isAudioEnabled = !audioState.isOff;

  const toggleVideo = useCallback(() => {
    if (callObject) {
      // If video is currently off (isOff is true), calling setLocalVideo(true) will turn it on.
      // If video is currently on (isOff is false), calling setLocalVideo(false) will turn it off.
      // So, we want to pass the current 'isOff' state to toggle it.
      callObject.setLocalVideo(videoState.isOff);
    }
  }, [callObject, videoState.isOff]);

  const toggleAudio = useCallback(() => {
    if (callObject) {
      // Similar logic for audio
      callObject.setLocalAudio(audioState.isOff);
    }
  }, [callObject, audioState.isOff]);

  // Effect to manage the video srcObject
  useEffect(() => {
    if (videoEl.current && videoState.track) {
      // The track is available on videoState.track
      videoEl.current.srcObject = new MediaStream([videoState.track]);
    } else if (videoEl.current) {
      videoEl.current.srcObject = null; // Clear if track is not available
    }
  }, [videoState.track]); // Re-run when the track changes

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 bg-slate-900 rounded-lg overflow-hidden relative">
        {isVideoEnabled && videoState.track ? ( // Check !isOff and if track exists
          <video
            ref={videoEl} // Use the ref here
            autoPlay
            muted // Local video should usually be muted to prevent echo
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center text-2xl">
              {localParticipant?.user_name?.[0]?.toUpperCase() || "?"}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-2 mt-4">
        <Button
          variant={isAudioEnabled ? "outline" : "secondary"}
          size="icon"
          onClick={toggleAudio}
          aria-label={isAudioEnabled ? "Mute microphone" : "Unmute microphone"}
        >
          {isAudioEnabled ? (
            <Mic className="h-4 w-4" />
          ) : (
            <MicOff className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant={isVideoEnabled ? "outline" : "secondary"}
          size="icon"
          onClick={toggleVideo}
          aria-label={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {isVideoEnabled ? (
            <Video className="h-4 w-4" />
          ) : (
            <VideoOff className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}

interface VideoInterfaceProps {
  roomUrl: string;
}

export function VideoInterface({ roomUrl }: VideoInterfaceProps) {
  if (!roomUrl) {
    return (
      <div className="h-full flex items-center justify-center">
        <div>Loading video chat...</div>
      </div>
    );
  }

  return (
    <DailyProvider url={roomUrl}>
      <ParticipantView />
    </DailyProvider>
  );
}

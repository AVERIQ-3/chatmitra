import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext.tsx';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Radio,
  ShieldCheck,
  Maximize2,
  Minimize2,
} from 'lucide-react';

export const CallModal: React.FC = () => {
  const { activeCall, callRole, respondCall, endCall } = useChat();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Call timer
  useEffect(() => {
    let interval: any = null;
    if (activeCall && activeCall.status === 'connected') {
      interval = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeCall?.status]);

  // Request camera / microphone when video call connects
  useEffect(() => {
    if (activeCall && activeCall.type === 'video' && activeCall.status === 'connected') {
      navigator.mediaDevices
        ?.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('Camera access not granted in iframe/device:', err);
        });
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [activeCall?.status, activeCall?.type]);

  if (!activeCall) return null;

  const isIncoming = callRole === 'receiver' && activeCall.status === 'ringing';
  const isOutgoing = callRole === 'caller' && activeCall.status === 'ringing';
  const isConnected = activeCall.status === 'connected';

  const partnerName = callRole === 'caller' ? activeCall.receiverName : activeCall.callerName;
  const partnerAvatar = callRole === 'caller' ? activeCall.receiverAvatar : activeCall.callerAvatar;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#14152c] border border-indigo-900/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col items-center justify-between min-h-[500px] p-6 sm:p-8">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/3 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Top Bar Status */}
        <div className="w-full flex items-center justify-between z-10">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 text-slate-300 border border-indigo-950">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            {isConnected
              ? `Connected &bull; ${formatTimer(callDuration)}`
              : isIncoming
              ? 'Incoming ' + activeCall.type + ' call...'
              : 'Calling ' + partnerName + '...'}
          </span>

          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            End-to-End Encrypted
          </span>
        </div>

        {/* Center: Video streams or Voice Visualizer */}
        <div className="my-auto text-center relative z-10 w-full flex flex-col items-center">
          {activeCall.type === 'video' && isConnected ? (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-indigo-900 shadow-2xl flex items-center justify-center">
              {/* Simulated Remote Video Stream */}
              <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950">
                <img
                  src={partnerAvatar}
                  alt=""
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-purple-500/40 animate-pulse"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-3 left-3 bg-black/60 px-2.5 py-1 rounded-lg text-xs font-medium text-white backdrop-blur-sm">
                  {partnerName}
                </div>
              </div>

              {/* Local User Self-Preview Camera Video */}
              <div className="absolute top-3 right-3 w-28 h-20 rounded-xl overflow-hidden bg-slate-900 border border-white/20 shadow-lg">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          ) : (
            /* Voice Call Profile Visualizer */
            <div className="space-y-4">
              <div className="relative inline-block">
                {/* Audio pulse wave rings */}
                {isConnected && (
                  <>
                    <span className="absolute -inset-3 rounded-full bg-violet-500/20 animate-ping opacity-75" />
                    <span className="absolute -inset-6 rounded-full bg-pink-500/10 animate-pulse" />
                  </>
                )}
                <img
                  src={partnerAvatar}
                  alt={partnerName}
                  className="w-28 h-28 rounded-full object-cover ring-4 ring-violet-500/60 shadow-2xl relative z-10"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white">{partnerName}</h3>
                <p className="text-xs text-slate-400 mt-1 capitalize font-medium">
                  ChatMitra {activeCall.type} session
                </p>
              </div>

              {/* Audio waveform simulation */}
              {isConnected && (
                <div className="flex items-center justify-center gap-1 h-6">
                  {[40, 75, 30, 90, 60, 100, 45, 80, 50, 70].map((h, idx) => (
                    <span
                      key={idx}
                      style={{ height: `${h}%` }}
                      className="w-1 bg-gradient-to-t from-violet-500 to-pink-400 rounded-full animate-pulse"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Call Controls */}
        <div className="w-full flex items-center justify-center gap-4 z-10 pt-4">
          {isIncoming ? (
            /* Accept & Reject Buttons */
            <div className="flex items-center gap-6">
              <button
                onClick={() => respondCall(false)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/40 transition-transform group-hover:scale-105 active:scale-95">
                  <PhoneOff className="w-6 h-6" />
                </div>
                <span className="text-xs text-slate-400 font-semibold">Decline</span>
              </button>

              <button
                onClick={() => respondCall(true)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 transition-transform group-hover:scale-105 active:scale-95 animate-bounce">
                  <Phone className="w-6 h-6" />
                </div>
                <span className="text-xs text-emerald-400 font-semibold">Accept</span>
              </button>
            </div>
          ) : (
            /* Active / Outgoing In-Call Controls */
            <div className="flex items-center gap-3">
              {/* Mute Mic */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3.5 rounded-full border transition-all ${
                  isMuted
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : 'bg-slate-900 border-indigo-950 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Toggle Video (if video call) */}
              {activeCall.type === 'video' && (
                <button
                  onClick={() => setIsVideoOff(!isVideoOff)}
                  className={`p-3.5 rounded-full border transition-all ${
                    isVideoOff
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                      : 'bg-slate-900 border-indigo-950 text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}

              {/* End Call Button */}
              <button
                onClick={endCall}
                className="py-3 px-6 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all hover:scale-105 active:scale-95"
              >
                <PhoneOff className="w-5 h-5" />
                <span>End Call</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

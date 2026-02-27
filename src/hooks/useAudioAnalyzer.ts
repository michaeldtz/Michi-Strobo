import { useState, useEffect, useRef, useCallback } from 'react';

export interface AudioData {
  volume: number;
  bass: number;
  mid: number;
  treble: number;
  frequencyData: Uint8Array;
  timeData: Uint8Array;
}

export const useAudioAnalyzer = (isActive: boolean) => {
  const [audioData, setAudioData] = useState<AudioData | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const timeArrayRef = useRef<Uint8Array | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const start = useCallback(async () => {
    if (audioContextRef.current) return;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const context = new AudioContextClass();
      const analyzer = context.createAnalyser();
      analyzer.fftSize = 256;
      
      const source = context.createMediaStreamSource(stream);
      source.connect(analyzer);

      audioContextRef.current = context;
      analyzerRef.current = analyzer;
      sourceRef.current = source;
      dataArrayRef.current = new Uint8Array(analyzer.frequencyBinCount);
      timeArrayRef.current = new Uint8Array(analyzer.frequencyBinCount);

      const update = () => {
        if (!analyzerRef.current || !dataArrayRef.current || !timeArrayRef.current) return;

        analyzerRef.current.getByteFrequencyData(dataArrayRef.current);
        analyzerRef.current.getByteTimeDomainData(timeArrayRef.current);

        const data = dataArrayRef.current;
        
        // Calculate ranges
        let volume = 0;
        let bass = 0;
        let mid = 0;
        let treble = 0;

        for (let i = 0; i < data.length; i++) {
          volume += data[i];
          // Use peak value for bass to catch beats better
          if (i < data.length * 0.15) {
            if (data[i] > bass) bass = data[i];
          }
          else if (i < data.length * 0.5) mid += data[i];
          else treble += data[i];
        }

        const count = data.length;
        setAudioData({
          volume: volume / count / 255,
          bass: bass / 255, // Already a peak value
          mid: mid / (count * 0.35) / 255,
          treble: treble / (count * 0.5) / 255,
          frequencyData: new Uint8Array(dataArrayRef.current),
          timeData: new Uint8Array(timeArrayRef.current),
        });

        animationFrameRef.current = requestAnimationFrame(update);
      };

      update();
    } catch (err) {
      console.error('Error accessing microphone:', err);
    }
  }, []);

  const stop = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(err => console.warn('AudioContext close error:', err));
      }
      audioContextRef.current = null;
    }
    
    if (sourceRef.current) {
      sourceRef.current.mediaStream.getTracks().forEach(track => track.stop());
      sourceRef.current = null;
    }

    analyzerRef.current = null;
    dataArrayRef.current = null;
    timeArrayRef.current = null;
    
    setAudioData(null);
  }, []);

  useEffect(() => {
    if (isActive) {
      start();
    } else {
      stop();
    }
    return () => stop();
  }, [isActive, start, stop]);

  return audioData;
};

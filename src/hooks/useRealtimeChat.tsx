import { useState, useRef, useEffect } from 'react';
import { AudioRecorder, encodeAudioForAPI, AudioQueue } from '@/utils/RealtimeAudio';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const useRealtimeChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const audioQueueRef = useRef<AudioQueue | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentTranscriptRef = useRef<string>('');
  const currentResponseRef = useRef<string>('');

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  const connect = async () => {
    try {
      setIsLoading(true);
      
      // Initialize audio context
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        audioQueueRef.current = new AudioQueue(audioContextRef.current);
      }

      // Connect to WebSocket
      const wsUrl = 'wss://ullqluvzkgnwwqijhvjr.supabase.co/functions/v1/support-chat';
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('Connected to support chat');
        setIsConnected(true);
        setIsLoading(false);
      };

      wsRef.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log('Received event:', data.type);

        if (data.type === 'error') {
          console.error('Error from server:', data.error);
          return;
        }

        // Handle audio deltas
        if (data.type === 'response.audio.delta') {
          setIsSpeaking(true);
          const binaryString = atob(data.delta);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          await audioQueueRef.current?.addToQueue(bytes);
        }

        // Handle audio completion
        if (data.type === 'response.audio.done') {
          setIsSpeaking(false);
        }

        // Handle input audio transcription
        if (data.type === 'conversation.item.input_audio_transcription.completed') {
          const transcript = data.transcript;
          if (transcript) {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'user',
              content: transcript,
              timestamp: new Date()
            }]);
          }
        }

        // Handle transcript deltas
        if (data.type === 'response.audio_transcript.delta') {
          currentResponseRef.current += data.delta;
        }

        // Handle transcript completion
        if (data.type === 'response.audio_transcript.done') {
          if (currentResponseRef.current) {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              content: currentResponseRef.current,
              timestamp: new Date()
            }]);
            currentResponseRef.current = '';
          }
        }

        // Handle text responses
        if (data.type === 'response.text.delta') {
          currentResponseRef.current += data.delta;
        }

        if (data.type === 'response.text.done') {
          if (currentResponseRef.current) {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              content: currentResponseRef.current,
              timestamp: new Date()
            }]);
            currentResponseRef.current = '';
          }
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsLoading(false);
        setIsConnected(false);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket closed');
        setIsConnected(false);
        setIsListening(false);
        setIsSpeaking(false);
      };

    } catch (error) {
      console.error('Error connecting:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const disconnect = () => {
    stopListening();
    wsRef.current?.close();
    audioContextRef.current?.close();
    audioQueueRef.current?.clear();
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
  };

  const startListening = async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected');
    }

    recorderRef.current = new AudioRecorder((audioData) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'input_audio_buffer.append',
          audio: encodeAudioForAPI(audioData)
        }));
      }
    });

    await recorderRef.current.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recorderRef.current?.stop();
    recorderRef.current = null;
    setIsListening(false);
  };

  const sendTextMessage = (text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected');
    }

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    }]);

    wsRef.current.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [{ type: 'input_text', text }]
      }
    }));

    wsRef.current.send(JSON.stringify({ type: 'response.create' }));
  };

  return {
    messages,
    isConnected,
    isListening,
    isSpeaking,
    isLoading,
    connect,
    disconnect,
    startListening,
    stopListening,
    sendTextMessage
  };
};

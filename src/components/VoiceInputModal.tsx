import React, { useState, useCallback } from 'react';
import { Mic, MicOff, X, Check, Loader2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as voice from '@/src/lib/voice';
import * as api from '@/src/lib/api';

interface VoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onLogged?: () => void;
}

// Added 'review' to the states
type VoiceState = 'idle' | 'listening' | 'review' | 'processing' | 'done' | 'error';

// This function was created using Generative AI
export function VoiceInputModal({ isOpen, onClose, userId, onLogged }: VoiceInputModalProps) {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  const [errorText, setErrorText] = useState('');

  const supported = voice.isSupported();

  const startRecording = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setConfirmationText('');
    setErrorText('');
    setState('listening');

    voice.startListening(
      (text, isFinal) => {
        if (isFinal) {
          // FIX: Just set the text directly instead of appending
          setTranscript(text); 
          setInterimTranscript('');
        } else {
          setInterimTranscript(text);
        }
      },
      () => {
        if (state === 'listening') stopAndReview();
      },
      (error) => {
        setState('error');
        setErrorText(error);
      }
    );
  }, [state]);

  // Step 1: Stop listening and let user review the text
  const stopAndReview = useCallback(() => {
    voice.stopListening();
    const finalTranscript = transcript || interimTranscript;

    if (!finalTranscript.trim()) {
      setState('error');
      setErrorText('No speech detected. Please try again.');
      return;
    }

    setTranscript(finalTranscript);
    setState('review');
  }, [transcript, interimTranscript]);

  // Step 2: Actually send to the backend
  const submitTranscript = useCallback(async () => {
    if (!transcript.trim()) return;
    
    setState('processing');
    try {
      // Your backend will talk to Gemini AND save it to the database for you.
      const result = await api.parseVoiceTranscript(userId, transcript);
      
      // Just check if the backend successfully logged anything
      if (result.parsed_entries && result.parsed_entries.length > 0) {
        
        setConfirmationText(result.confirmation_text || "Successfully logged your usage!");
        setState('done');
        onLogged?.(); // Tells the dashboard to refresh its charts!
      } else {
        setState('error');
        setErrorText(result.confirmation_text || "Couldn't find any matching appliances or hours.");
      }
    } catch (err) {
      console.error(err);
      setState('error');
      setErrorText('Failed to process voice input.');
    }
  }, [transcript, userId, onLogged]);

  const reset = useCallback(() => {
    setState('idle');
    setTranscript('');
    setInterimTranscript('');
    setConfirmationText('');
    setErrorText('');
  }, []);

  const handleClose = useCallback(() => {
    voice.stopListening();
    reset();
    onClose();
  }, [onClose, reset]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={e => e.stopPropagation()}
          className="bg-surface-container-lowest rounded-3xl p-8 w-full max-w-md shadow-2xl border border-outline-variant/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-headline font-bold text-xl">Voice Input</h3>
            <button onClick={handleClose} className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
              <X className="w-5 h-5 text-on-surface-variant" />
            </button>
          </div>

          {!supported ? (
            <div className="text-center py-8">
              <MicOff className="w-16 h-16 text-on-surface-variant/30 mx-auto mb-4" />
              <p className="text-sm text-on-surface-variant">
                Voice input is not supported in this browser. Please try Chrome or Edge.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              
              {/* Main Button Area (Hidden during review/processing/done) */}
              {(state === 'idle' || state === 'listening') && (
                <div className="relative">
                  {state === 'listening' && (
                    <>
                      <div className="absolute inset-0 rounded-full bg-primary-container animate-ping opacity-20" style={{ margin: '-16px' }} />
                      <div className="absolute inset-0 rounded-full bg-primary-container/30 animate-pulse" style={{ margin: '-8px' }} />
                    </>
                  )}
                  <button
                    onClick={state === 'listening' ? stopAndReview : startRecording}
                    className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                      state === 'listening'
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                        : 'bg-primary-container text-on-primary-container hover:shadow-lg'
                    }`}
                  >
                    {state === 'listening' ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
                  </button>
                </div>
              )}

              {/* Status Text */}
              <p className="text-sm text-on-surface-variant font-medium text-center">
                {state === 'idle' && 'Tap the mic and say something like:'}
                {state === 'listening' && 'Listening... Tap to stop'}
                {state === 'review' && 'Review your log before saving:'}
                {state === 'processing' && 'Processing your input...'}
                {state === 'done' && 'Done!'}
                {state === 'error' && 'Something went wrong'}
              </p>

              {state === 'idle' && (
                <p className="text-xs text-on-surface-variant/70 text-center italic">
                  "I used the AC for 6 hours and the fan for 12 hours today"
                </p>
              )}

              {/* Transcript Display (Read-only while listening) */}
              {state === 'listening' && (transcript || interimTranscript) && (
                <div className="w-full bg-surface-container-low rounded-2xl p-4">
                  <p className="text-sm text-on-surface">
                    {transcript}
                    {interimTranscript && <span className="text-on-surface-variant/50"> {interimTranscript}</span>}
                  </p>
                </div>
              )}

              {/* Editable Transcript (The Review State) */}
              {state === 'review' && (
                <div className="w-full space-y-4">
                  <textarea 
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-2xl p-4 text-sm focus:ring-2 focus:ring-primary-container min-h-[100px] resize-none"
                    placeholder="Type your usage here..."
                  />
                  <div className="flex gap-3">
                    <button onClick={reset} className="flex-1 py-3 bg-surface-container-low text-on-surface rounded-xl font-bold text-sm hover:bg-surface-container-high transition-colors">
                      Retake
                    </button>
                    <button onClick={submitTranscript} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center justify-center gap-2">
                      <Send className="w-4 h-4" /> Log It
                    </button>
                  </div>
                </div>
              )}

              {/* Processing Spinner */}
              {state === 'processing' && (
                <div className="py-8">
                  <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                </div>
              )}

              {/* Confirmation */}
              {state === 'done' && confirmationText && (
                <div className="w-full bg-green-50 border border-green-200 rounded-2xl p-4 flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-green-800">{confirmationText}</p>
                </div>
              )}

              {/* Error */}
              {state === 'error' && errorText && (
                <div className="w-full bg-red-50 border border-red-200 rounded-2xl p-4">
                  <p className="text-sm text-red-700">{errorText}</p>
                </div>
              )}

              {/* Action Buttons for Done/Error states */}
              {(state === 'done' || state === 'error') && (
                <div className="flex gap-3 w-full">
                  <button onClick={reset} className="flex-1 py-3 bg-surface-container-low text-on-surface rounded-xl font-bold text-sm hover:bg-surface-container-high transition-colors">
                    Log Another
                  </button>
                  <button onClick={handleClose} className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all">
                    Done
                  </button>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
import React, { useState, useCallback } from 'react';
import { Mic, MicOff, X, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as voice from '@/src/lib/voice';
import * as api from '@/src/lib/api';

interface VoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onLogged?: () => void;
}

type VoiceState = 'idle' | 'listening' | 'processing' | 'done' | 'error';

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
          setTranscript(prev => (prev ? prev + ' ' + text : text));
          setInterimTranscript('');
        } else {
          setInterimTranscript(text);
        }
      },
      () => {
        // onEnd — speech recognition stopped
      },
      (error) => {
        setState('error');
        setErrorText(error);
      }
    );
  }, []);

  const stopAndProcess = useCallback(async () => {
    voice.stopListening();
    const finalTranscript = transcript || interimTranscript;

    if (!finalTranscript.trim()) {
      setState('error');
      setErrorText('No speech detected. Please try again.');
      return;
    }

    setState('processing');
    setTranscript(finalTranscript);

    try {
      const result = await api.parseVoiceTranscript(userId, finalTranscript);
      setConfirmationText(result.confirmation_text);
      setState('done');
      if (result.parsed_entries.length > 0) {
        onLogged?.();
      }
    } catch (err) {
      setState('error');
      setErrorText('Failed to process voice input. Please try again.');
    }
  }, [transcript, interimTranscript, userId, onLogged]);

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
              {/* Mic Button */}
              <div className="relative">
                {state === 'listening' && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-primary-container animate-ping opacity-20" style={{ margin: '-16px' }} />
                    <div className="absolute inset-0 rounded-full bg-primary-container/30 animate-pulse" style={{ margin: '-8px' }} />
                  </>
                )}
                <button
                  onClick={state === 'listening' ? stopAndProcess : startRecording}
                  disabled={state === 'processing'}
                  className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all active:scale-95 ${
                    state === 'listening'
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                      : state === 'processing'
                      ? 'bg-surface-container-low text-on-surface-variant cursor-wait'
                      : 'bg-primary-container text-on-primary-container hover:shadow-lg'
                  }`}
                >
                  {state === 'processing' ? (
                    <Loader2 className="w-10 h-10 animate-spin" />
                  ) : state === 'listening' ? (
                    <MicOff className="w-10 h-10" />
                  ) : (
                    <Mic className="w-10 h-10" />
                  )}
                </button>
              </div>

              {/* Status Text */}
              <p className="text-sm text-on-surface-variant font-medium text-center">
                {state === 'idle' && 'Tap the mic and say something like:'}
                {state === 'listening' && 'Listening... Tap to stop'}
                {state === 'processing' && 'Processing your input...'}
                {state === 'done' && 'Done!'}
                {state === 'error' && 'Something went wrong'}
              </p>

              {state === 'idle' && (
                <p className="text-xs text-on-surface-variant/70 text-center italic">
                  "I used the AC for 6 hours and the fan for 12 hours today"
                </p>
              )}

              {/* Transcript Display */}
              {(transcript || interimTranscript) && (
                <div className="w-full bg-surface-container-low rounded-2xl p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Transcript</p>
                  <p className="text-sm text-on-surface">
                    {transcript}
                    {interimTranscript && <span className="text-on-surface-variant/50"> {interimTranscript}</span>}
                  </p>
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

              {/* Action Buttons */}
              {(state === 'done' || state === 'error') && (
                <div className="flex gap-3 w-full">
                  <button
                    onClick={reset}
                    className="flex-1 py-3 bg-surface-container-low text-on-surface rounded-xl font-bold text-sm hover:bg-surface-container-high transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex-1 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all"
                  >
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

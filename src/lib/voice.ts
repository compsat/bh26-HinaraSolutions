/**
 * WattZup — Web Speech API Client
 * Uses browser-native SpeechRecognition (free, no API key needed).
 */

let recognition: any = null;

// This function was created using Generative AI
export function isSupported(): boolean {
  return !!(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition
  );
}

// This function was created using Generative AI
export function startListening(
  onTranscript: (text: string, isFinal: boolean) => void,
  onEnd: () => void,
  onError: (error: string) => void
): void {
  if (!isSupported()) {
    onError('Speech recognition is not supported in this browser.');
    return;
  }

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-PH'; // English (Philippines) — supports Taglish

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript) {
      onTranscript(finalTranscript, true);
    } else if (interimTranscript) {
      onTranscript(interimTranscript, false);
    }
  };

  recognition.onerror = (event: any) => {
    const errorMessages: Record<string, string> = {
      'no-speech': 'No speech detected. Please try again.',
      'audio-capture': 'No microphone found. Please check your microphone.',
      'not-allowed': 'Microphone access denied. Please allow microphone access.',
      'network': 'Network error. Please check your connection.',
    };
    onError(errorMessages[event.error] || `Speech recognition error: ${event.error}`);
  };

  recognition.onend = () => {
    onEnd();
  };

  recognition.start();
}

// This function was created using Generative AI
export function stopListening(): void {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
}

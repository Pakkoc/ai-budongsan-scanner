/**
 * AI QnA Reducer
 * 참조: docs/pages/05-ai-question-publication/state.md
 */

export type Message = {
  role: 'user' | 'ai';
  content: string;
  position: number;
};

export type AiQnaState = {
  messages: Message[];
  userInput: string;
  isStreaming: boolean;
  streamingContent: string;
  isPublic: boolean;
  disclaimerAcknowledged: boolean;
  saveStatus: 'idle' | 'saving' | 'success' | 'error';
  errorMessage: string | null;
};

export type AiQnaAction =
  | { type: 'SET_USER_INPUT'; input: string }
  | { type: 'SEND_MESSAGE'; content: string }
  | { type: 'STREAM_START' }
  | { type: 'STREAM_CHUNK'; chunk: string }
  | { type: 'STREAM_END' }
  | { type: 'STREAM_ERROR'; error: string }
  | { type: 'TOGGLE_PUBLIC' }
  | { type: 'ACKNOWLEDGE_DISCLAIMER' }
  | { type: 'SAVE_REQUEST' }
  | { type: 'SAVE_SUCCESS'; redirectTo: string }
  | { type: 'SAVE_FAILURE'; error: string }
  | { type: 'RESET' };

export const initialState: AiQnaState = {
  messages: [],
  userInput: '',
  isStreaming: false,
  streamingContent: '',
  isPublic: false,
  disclaimerAcknowledged: false,
  saveStatus: 'idle',
  errorMessage: null,
};

export function aiQnaReducer(state: AiQnaState, action: AiQnaAction): AiQnaState {
  switch (action.type) {
    case 'SET_USER_INPUT':
      return {
        ...state,
        userInput: action.input,
      };

    case 'SEND_MESSAGE': {
      const newMessage: Message = {
        role: 'user',
        content: action.content,
        position: state.messages.length,
      };
      return {
        ...state,
        messages: [...state.messages, newMessage],
        userInput: '',
        isStreaming: true,
        streamingContent: '',
        errorMessage: null,
      };
    }

    case 'STREAM_START':
      return {
        ...state,
        isStreaming: true,
        streamingContent: '',
      };

    case 'STREAM_CHUNK':
      return {
        ...state,
        streamingContent: state.streamingContent + action.chunk,
      };

    case 'STREAM_END': {
      const aiMessage: Message = {
        role: 'ai',
        content: state.streamingContent,
        position: state.messages.length,
      };
      return {
        ...state,
        messages: [...state.messages, aiMessage],
        isStreaming: false,
        streamingContent: '',
      };
    }

    case 'STREAM_ERROR':
      return {
        ...state,
        isStreaming: false,
        streamingContent: '',
        errorMessage: action.error,
      };

    case 'TOGGLE_PUBLIC':
      return {
        ...state,
        isPublic: !state.isPublic,
      };

    case 'ACKNOWLEDGE_DISCLAIMER':
      return {
        ...state,
        disclaimerAcknowledged: !state.disclaimerAcknowledged,
      };

    case 'SAVE_REQUEST':
      return {
        ...state,
        saveStatus: 'saving',
        errorMessage: null,
      };

    case 'SAVE_SUCCESS':
      return {
        ...state,
        saveStatus: 'success',
      };

    case 'SAVE_FAILURE':
      return {
        ...state,
        saveStatus: 'error',
        errorMessage: action.error,
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}


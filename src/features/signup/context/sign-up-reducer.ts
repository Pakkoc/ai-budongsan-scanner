/**
 * 회원가입 Reducer
 * 참조: docs/pages/01-general-signup/state.md, docs/pages/02-lawyer-signup/state.md
 * TDD: Red → Green → Refactor
 */

export type SignUpTab = 'user' | 'lawyer';

export type SignUpFormValues = {
  user: {
    email: string;
    password: string;
    confirmPassword: string;
    nickname: string;
    agreeTerms: boolean;
    agreePrivacy: boolean;
  };
  lawyer: {
    email: string;
    password: string;
    confirmPassword: string;
    nickname: string;
    fullName: string;
    barNumber: string;
    agreeTerms: boolean;
    agreePrivacy: boolean;
  };
};

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

export type SubmitStatus = 'idle' | 'validating' | 'submitting' | 'success' | 'error';

export type BarNumberLookupStatus = 'idle' | 'checking' | 'valid' | 'invalid';

export type SignUpState = {
  activeTab: SignUpTab;
  formValues: SignUpFormValues;
  fieldErrors: {
    user: FieldErrors<SignUpFormValues['user']>;
    lawyer: FieldErrors<SignUpFormValues['lawyer']>;
  };
  touched: {
    user: Partial<Record<keyof SignUpFormValues['user'], boolean>>;
    lawyer: Partial<Record<keyof SignUpFormValues['lawyer'], boolean>>;
  };
  submitStatus: {
    user: SubmitStatus;
    lawyer: SubmitStatus;
  };
  serverError: string | null;
  redirectCountdown: number;
  barNumberLookup: {
    status: BarNumberLookupStatus;
    message?: string;
  };
  postSubmitHintVisible: boolean;
  consentVersions: {
    terms: string;
    privacy: string;
    loaded: boolean;
  };
};

export type SignUpAction =
  | { type: 'SWITCH_TAB'; tab: SignUpTab }
  | { type: 'CHANGE_FIELD'; tab: SignUpTab; field: string; value: unknown }
  | { type: 'MARK_TOUCHED'; tab: SignUpTab; field: string }
  | { type: 'VALIDATION_FAILED'; tab: SignUpTab; errors: Record<string, string> }
  | { type: 'SUBMIT_REQUEST'; tab: SignUpTab }
  | { type: 'SUBMIT_SUCCESS'; tab: SignUpTab }
  | { type: 'SUBMIT_FAILURE'; error: string }
  | { type: 'CONSENT_LOADED'; terms: string; privacy: string }
  | { type: 'TICK_REDIRECT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'REQUEST_BAR_CHECK' }
  | { type: 'BAR_CHECK_SUCCESS'; message?: string }
  | { type: 'BAR_CHECK_FAILURE'; message: string }
  | { type: 'DISMISS_HINT' };

export const initialState: SignUpState = {
  activeTab: 'user',
  formValues: {
    user: {
      email: '',
      password: '',
      confirmPassword: '',
      nickname: '',
      agreeTerms: false,
      agreePrivacy: false,
    },
    lawyer: {
      email: '',
      password: '',
      confirmPassword: '',
      nickname: '',
      fullName: '',
      barNumber: '',
      agreeTerms: false,
      agreePrivacy: false,
    },
  },
  fieldErrors: {
    user: {},
    lawyer: {},
  },
  touched: {
    user: {},
    lawyer: {},
  },
  submitStatus: {
    user: 'idle',
    lawyer: 'idle',
  },
  serverError: null,
  redirectCountdown: 0,
  barNumberLookup: {
    status: 'idle',
  },
  postSubmitHintVisible: false,
  consentVersions: {
    terms: '',
    privacy: '',
    loaded: false,
  },
};

export function signUpReducer(
  state: SignUpState,
  action: SignUpAction
): SignUpState {
  switch (action.type) {
    case 'SWITCH_TAB':
      return {
        ...state,
        activeTab: action.tab,
        serverError: null,
      };

    case 'CHANGE_FIELD': {
      const tab = action.tab;
      return {
        ...state,
        formValues: {
          ...state.formValues,
          [tab]: {
            ...state.formValues[tab],
            [action.field]: action.value,
          },
        },
        fieldErrors: {
          ...state.fieldErrors,
          [tab]: {
            ...state.fieldErrors[tab],
            [action.field]: undefined,
          },
        },
      };
    }

    case 'MARK_TOUCHED': {
      const tab = action.tab;
      return {
        ...state,
        touched: {
          ...state.touched,
          [tab]: {
            ...state.touched[tab],
            [action.field]: true,
          },
        },
      };
    }

    case 'VALIDATION_FAILED': {
      const tab = action.tab;
      return {
        ...state,
        fieldErrors: {
          ...state.fieldErrors,
          [tab]: action.errors,
        },
        submitStatus: {
          ...state.submitStatus,
          [tab]: 'idle',
        },
      };
    }

    case 'SUBMIT_REQUEST': {
      const tab = action.tab;
      return {
        ...state,
        submitStatus: {
          ...state.submitStatus,
          [tab]: 'submitting',
        },
        serverError: null,
      };
    }

    case 'SUBMIT_SUCCESS': {
      const tab = action.tab;
      return {
        ...state,
        submitStatus: {
          ...state.submitStatus,
          [tab]: 'success',
        },
        redirectCountdown: 3,
        postSubmitHintVisible: tab === 'lawyer',
      };
    }

    case 'SUBMIT_FAILURE':
      return {
        ...state,
        submitStatus: {
          ...state.submitStatus,
          [state.activeTab]: 'error',
        },
        serverError: action.error,
      };

    case 'CONSENT_LOADED':
      return {
        ...state,
        consentVersions: {
          terms: action.terms,
          privacy: action.privacy,
          loaded: true,
        },
      };

    case 'TICK_REDIRECT':
      return {
        ...state,
        redirectCountdown: Math.max(0, state.redirectCountdown - 1),
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        serverError: null,
      };

    case 'REQUEST_BAR_CHECK':
      return {
        ...state,
        barNumberLookup: {
          status: 'checking',
        },
      };

    case 'BAR_CHECK_SUCCESS':
      return {
        ...state,
        barNumberLookup: {
          status: 'valid',
          message: action.message,
        },
      };

    case 'BAR_CHECK_FAILURE':
      return {
        ...state,
        barNumberLookup: {
          status: 'invalid',
          message: action.message,
        },
      };

    case 'DISMISS_HINT':
      return {
        ...state,
        postSubmitHintVisible: false,
      };

    default:
      return state;
  }
}


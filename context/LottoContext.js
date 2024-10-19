import React, { createContext, useReducer, useContext } from 'react';

// 초기 상태 정의
const initialState = {
  recentWinningNumbers: null,
  currentDrawNo: 1141,
  pastWinningNumbers: [],
  showPastNumbers: false,
  excludeNumbers: '',
  includeNumbers: '',
  lottoNumbers: [],
  finalNumbers: [],
  animationKey: 0,
  loadingRecent: false,
  loadingPast: false,
};

// 리듀서 함수 정의
const reducer = (state, action) => {
  switch (action.type) {
    case 'SET_RECENT_WINNING_NUMBERS':
      return { ...state, recentWinningNumbers: action.payload };
    case 'SET_CURRENT_DRAW_NO':
      return { ...state, currentDrawNo: action.payload };
    case 'SET_PAST_WINNING_NUMBERS':
      return { ...state, pastWinningNumbers: action.payload };
    case 'TOGGLE_PAST_NUMBERS':
      return { ...state, showPastNumbers: !state.showPastNumbers };
    case 'SET_EXCLUDE_NUMBERS':
      return { ...state, excludeNumbers: action.payload };
    case 'SET_INCLUDE_NUMBERS':
      return { ...state, includeNumbers: action.payload };
    case 'SET_LOTTO_NUMBERS':
      return { ...state, lottoNumbers: action.payload };
    case 'SET_FINAL_NUMBERS':
      return { ...state, finalNumbers: action.payload };
    case 'SET_ANIMATION_KEY':
      return { ...state, animationKey: state.animationKey + 1 };
    case 'SET_LOADING_RECENT':
      return { ...state, loadingRecent: action.payload };
    case 'SET_LOADING_PAST':
      return { ...state, loadingPast: action.payload };
    default:
      return state;
  }
};

// Context 생성
const LottoContext = createContext();

// Context Provider 컴포넌트
export const LottoProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  return (
    <LottoContext.Provider value={{ state, dispatch }}>
      {children}
    </LottoContext.Provider>
  );
};

// Context 사용을 위한 커스텀 훅
export const useLottoContext = () => {
  return useContext(LottoContext);
};


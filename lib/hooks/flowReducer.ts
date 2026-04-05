import { CharacterState } from '../types';


export type FlowPhase = 'waiting_permission' | 'monitoring' | 'recording' | 'playing' | 'idle';

export interface FlowState {
  characterState: CharacterState;
  phase: FlowPhase;
}

export type FlowAction =
  | { type: 'PERMISSION_GRANTED' }
  | { type: 'VOICE_DETECTED' }
  | { type: 'RECORDING_STOPPED'; uri: string; speechStartMs: number; speechEndMs: number }
  | { type: 'PLAYBACK_STARTED' }
  | { type: 'PLAYBACK_FINISHED' };

export const initialFlowState: FlowState = {
  characterState: 'idle',
  phase: 'waiting_permission',
};

export const flowReducer = (state: FlowState, action: FlowAction): FlowState => {
  console.log('[FLOW] dispatch:', action.type, '| current phase:', state.phase);

  switch (action.type) {
    case 'PERMISSION_GRANTED':
      if (state.phase === 'waiting_permission' || state.phase === 'idle') {
        return { ...state, phase: 'monitoring' };
      }
      return state;

    case 'VOICE_DETECTED':
      if (state.phase === 'monitoring') {
        return { characterState: 'hear', phase: 'recording' };
      }
      return state;

    case 'RECORDING_STOPPED':
      if (state.phase === 'recording') {
        return { ...state, phase: 'playing' };
      }
      return state;

    case 'PLAYBACK_STARTED':
      if (state.phase === 'playing') {
        return { characterState: 'talk', phase: 'playing' };
      }
      return state;

    case 'PLAYBACK_FINISHED':
      if (state.phase === 'playing') {
        return { characterState: 'idle', phase: 'monitoring' };
      }
      return state;

    default:
      return state;
  }
};

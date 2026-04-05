import { flowReducer, initialFlowState, FlowState, FlowAction } from '../../../lib/hooks/flowReducer';


describe('flowReducer', () => {
  it('should have correct initial state', () => {
    expect(initialFlowState).toEqual({
      characterState: 'idle',
      phase: 'waiting_permission',
    });
  });

  describe('PERMISSION_GRANTED', () => {
    it('should transition from waiting_permission to monitoring', () => {
      const result = flowReducer(initialFlowState, { type: 'PERMISSION_GRANTED' });

      expect(result).toEqual({
        characterState: 'idle',
        phase: 'monitoring',
      });
    });

    it('should transition from idle to monitoring', () => {
      const state: FlowState = { characterState: 'idle', phase: 'idle' };
      const result = flowReducer(state, { type: 'PERMISSION_GRANTED' });

      expect(result).toEqual({
        characterState: 'idle',
        phase: 'monitoring',
      });
    });

    it('should ignore when already monitoring', () => {
      const state: FlowState = { characterState: 'idle', phase: 'monitoring' };
      const result = flowReducer(state, { type: 'PERMISSION_GRANTED' });

      expect(result).toBe(state);
    });

    it('should ignore when recording', () => {
      const state: FlowState = { characterState: 'hear', phase: 'recording' };
      const result = flowReducer(state, { type: 'PERMISSION_GRANTED' });

      expect(result).toBe(state);
    });
  });

  describe('VOICE_DETECTED', () => {
    it('should transition from monitoring to recording with hear state', () => {
      const state: FlowState = { characterState: 'idle', phase: 'monitoring' };
      const result = flowReducer(state, { type: 'VOICE_DETECTED' });

      expect(result).toEqual({
        characterState: 'hear',
        phase: 'recording',
      });
    });

    it('should ignore when not monitoring', () => {
      const state: FlowState = { characterState: 'hear', phase: 'recording' };
      const result = flowReducer(state, { type: 'VOICE_DETECTED' });

      expect(result).toBe(state);
    });

    it('should ignore when playing', () => {
      const state: FlowState = { characterState: 'talk', phase: 'playing' };
      const result = flowReducer(state, { type: 'VOICE_DETECTED' });

      expect(result).toBe(state);
    });
  });

  describe('RECORDING_STOPPED', () => {
    const action: FlowAction = {
      type: 'RECORDING_STOPPED',
      uri: 'file://test.m4a',
      speechStartMs: 1000,
      speechEndMs: 5000,
    };

    it('should transition from recording to playing, keeping hear state', () => {
      const state: FlowState = { characterState: 'hear', phase: 'recording' };
      const result = flowReducer(state, action);

      expect(result).toEqual({
        characterState: 'hear',
        phase: 'playing',
      });
    });

    it('should ignore when not recording', () => {
      const state: FlowState = { characterState: 'idle', phase: 'monitoring' };
      const result = flowReducer(state, action);

      expect(result).toBe(state);
    });
  });

  describe('PLAYBACK_STARTED', () => {
    it('should transition character to talk when playing', () => {
      const state: FlowState = { characterState: 'hear', phase: 'playing' };
      const result = flowReducer(state, { type: 'PLAYBACK_STARTED' });

      expect(result).toEqual({
        characterState: 'talk',
        phase: 'playing',
      });
    });

    it('should ignore when not playing', () => {
      const state: FlowState = { characterState: 'idle', phase: 'monitoring' };
      const result = flowReducer(state, { type: 'PLAYBACK_STARTED' });

      expect(result).toBe(state);
    });
  });

  describe('PLAYBACK_FINISHED', () => {
    it('should transition to idle + monitoring when playing', () => {
      const state: FlowState = { characterState: 'talk', phase: 'playing' };
      const result = flowReducer(state, { type: 'PLAYBACK_FINISHED' });

      expect(result).toEqual({
        characterState: 'idle',
        phase: 'monitoring',
      });
    });

    it('should ignore when not playing', () => {
      const state: FlowState = { characterState: 'idle', phase: 'monitoring' };
      const result = flowReducer(state, { type: 'PLAYBACK_FINISHED' });

      expect(result).toBe(state);
    });
  });

  describe('full flow cycle', () => {
    it('should complete a full cycle: permission → monitor → record → play → monitor', () => {
      let state = initialFlowState;

      state = flowReducer(state, { type: 'PERMISSION_GRANTED' });
      expect(state).toEqual({ characterState: 'idle', phase: 'monitoring' });

      state = flowReducer(state, { type: 'VOICE_DETECTED' });
      expect(state).toEqual({ characterState: 'hear', phase: 'recording' });

      state = flowReducer(state, {
        type: 'RECORDING_STOPPED',
        uri: 'file://test.m4a',
        speechStartMs: 500,
        speechEndMs: 3000,
      });
      expect(state).toEqual({ characterState: 'hear', phase: 'playing' });

      state = flowReducer(state, { type: 'PLAYBACK_STARTED' });
      expect(state).toEqual({ characterState: 'talk', phase: 'playing' });

      state = flowReducer(state, { type: 'PLAYBACK_FINISHED' });
      expect(state).toEqual({ characterState: 'idle', phase: 'monitoring' });
    });
  });

  describe('unknown action', () => {
    it('should return current state for unknown action type', () => {
      const state: FlowState = { characterState: 'idle', phase: 'monitoring' };
      const result = flowReducer(state, { type: 'UNKNOWN' } as unknown as FlowAction);

      expect(result).toBe(state);
    });
  });
});

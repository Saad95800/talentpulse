import userReducer, { setUser, updateCredits, logout, User } from '../userSlice';

describe('userSlice', () => {
  const initialState = {
    user: null,
    token: null,
    isLoggedIn: false,
    isVerified: false,
  };

  it('should return the initial state', () => {
    expect(userReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setUser with token', () => {
    const userPayload: User & { token?: string } = {
      id: '123',
      name: 'Test Name',
      email: 'test@example.com',
      phone: '0102030405',
      credits: 3,
      role: 'USER',
      token: 'jwt-token',
    };
    const actual = userReducer(initialState, setUser(userPayload));
    expect(actual.isLoggedIn).toBe(true);
    expect(actual.isVerified).toBe(true);
    expect(actual.token).toBe('jwt-token');
    expect(actual.user?.id).toBe('123');
  });

  it('should handle updateCredits', () => {
    const mockUser: User = { 
      id: '1', 
      credits: 3,
      name: 'Test',
      email: 'test@test.com',
      phone: '123',
      role: 'USER'
    };
    const state = { ...initialState, user: mockUser };
    const actual = userReducer(state, updateCredits(2));
    expect(actual.user?.credits).toBe(2);
  });

  it('should handle logout', () => {
    const mockUser: User = { 
      id: '123', 
      credits: 3,
      name: 'Test',
      email: 'test@test.com',
      phone: '123',
      role: 'USER'
    };
    const loggedInState = {
      user: mockUser,
      token: 'token',
      isLoggedIn: true,
      isVerified: true
    };
    const actual = userReducer(loggedInState, logout());
    expect(actual).toEqual(initialState);
  });
});

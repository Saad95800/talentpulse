import userReducer, { setUser, updateCredits, clearUser } from '../userSlice';

describe('userSlice', () => {
  const initialState = {
    isLoggedIn: false,
    id: null,
    name: null,
    email: null,
    phone: null,
    credits: 0,
  };

  it('should return the initial state', () => {
    expect(userReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setUser', () => {
    const userPayload = {
      id: '123',
      name: 'Test Name',
      email: 'test@example.com',
      phone: '0612345678',
      credits: 3,
    };
    const actual = userReducer(initialState, setUser(userPayload));
    expect(actual.isLoggedIn).toBe(true);
    expect(actual.id).toBe('123');
    expect(actual.name).toBe('Test Name');
    expect(actual.credits).toBe(3);
  });

  it('should handle updateCredits', () => {
    const actual = userReducer({ ...initialState, credits: 3 }, updateCredits(2));
    expect(actual.credits).toBe(2);
  });

  it('should handle clearUser', () => {
    const loggedInState = {
      isLoggedIn: true,
      id: '123',
      name: 'Test Name',
      email: 'test@example.com',
      phone: '0612345678',
      credits: 3,
    };
    const actual = userReducer(loggedInState, clearUser());
    expect(actual).toEqual(initialState);
  });
});

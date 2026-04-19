import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// @ts-expect-error - Mocking global TextEncoder for tests
global.TextEncoder = TextEncoder;
// @ts-expect-error - Mocking global TextDecoder for tests
global.TextDecoder = TextDecoder;

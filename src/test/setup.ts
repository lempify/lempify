import '@testing-library/jest-dom';
import { mockWindows } from '@tauri-apps/api/mocks';

// Provide a fake Tauri window environment for all tests.
// The first argument is the "current" window label.
mockWindows('main');

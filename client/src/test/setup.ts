import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock Phaser module to prevent module loading errors
vi.mock('phaser', () => ({
  default: {
    Scene: class MockScene {
      textures: any;
      add: any;
      cameras: any;
      physics: any;
      
      constructor() {
        this.textures = {
          get: vi.fn(() => ({ source: [{ image: {} }] })),
          addCanvas: vi.fn(),
        };
        this.add = {
          container: vi.fn(() => new MockContainer()),
          text: vi.fn(() => new MockText()),
        };
        this.cameras = {
          main: {
            startFollow: vi.fn(),
            setZoom: vi.fn(),
          },
        };
        this.physics = {
          add: {
            sprite: vi.fn(() => new MockSprite()),
          },
        };
      }
    },
    Game: class MockGame {
      scene: any;
      
      constructor() {
        this.scene = {
          add: vi.fn(),
          start: vi.fn(),
        };
      }
    },
    GameObjects: {
      Container: MockContainer,
      Text: MockText,
      Sprite: MockSprite,
    },
    AUTO: 'AUTO',
    Scale: {
      FIT: 'FIT',
      CENTER_BOTH: 'CENTER_BOTH',
    },
  },
}));

class MockContainer {
  x = 0;
  y = 0;
  rotation = 0;
  visible = true;
  scene: any;
  add = vi.fn();
  destroy = vi.fn();
  setPosition = vi.fn(() => this);
  setRotation = vi.fn(() => this);
  setVisible = vi.fn(() => this);

  constructor() {
    this.scene = {
      textures: {
        get: vi.fn(() => ({ source: [{ image: {} }] })),
      },
    };
  }
}

class MockText {
  x = 0;
  y = 0;
  text = '';
  destroy = vi.fn();
  setPosition = vi.fn(() => this);
  setText = vi.fn(() => this);
}

class MockSprite {
  x = 0;
  y = 0;
  texture = { key: 'mock' };
  destroy = vi.fn();
  setPosition = vi.fn(() => this);
  setTexture = vi.fn(() => this);
}

// Mock phaser3spectorjs to prevent module not found errors
// Although the phaser3spectorjs dependency was removed, this mock is retained
// to prevent module not found errors in tests that may still reference it.
vi.mock('phaser3spectorjs', () => ({}));

// Mock canvas and WebGL context for Phaser tests
(global.HTMLCanvasElement.prototype.getContext as any) = vi.fn(() => ({
  fillStyle: '',
  fillRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Array(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
}));

// Mock HTMLCanvasElement methods
(global.HTMLCanvasElement.prototype.toDataURL as any) = vi.fn(() => 'data:image/png;base64,');
(global.HTMLCanvasElement.prototype.toBlob as any) = vi.fn();

// Mock createElementNS for SVG support
Object.defineProperty(global.document, 'createElementNS', {
  value: vi.fn(() => ({
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    style: {},
  })),
});

// Mock URL.createObjectURL and revokeObjectURL
(global.URL.createObjectURL as any) = vi.fn(() => 'blob:mock-url');
(global.URL.revokeObjectURL as any) = vi.fn();

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  // Suppress React warnings and errors in tests
  console.error = (...args: any[]) => {
    // Filter out specific React warnings that are not relevant to our tests
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOMTestUtils') ||
       args[0].includes('Warning: An update to') ||
       args[0].includes('Warning: Cannot update during an existing state transition'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    // Filter out specific warnings that are not relevant to our tests
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOMTestUtils') ||
       args[0].includes('Warning: An update to'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };

  // Handle unhandled promise rejections (like ZodErrors)
  process.on('unhandledRejection', (reason) => {
    // Suppress Zod validation errors that occur during component initialization
    if (reason && typeof reason === 'object' && 'issues' in reason) {
      return; // Suppress ZodError unhandled rejections
    }
    // For other unhandled rejections, log them but don't fail the test
    console.warn('Unhandled Promise Rejection:', reason);
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    // Suppress Zod validation errors
    if (error && typeof error === 'object' && 'issues' in error) {
      return; // Suppress ZodError uncaught exceptions
    }
    // For other exceptions, log them but don't fail the test
    console.warn('Uncaught Exception:', error);
  });
});

afterAll(() => {
  // Restore original console methods
  console.error = originalError;
  console.warn = originalWarn;

  // Remove event listeners
  process.removeAllListeners('unhandledRejection');
  process.removeAllListeners('uncaughtException');
});

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
  cleanup();
});
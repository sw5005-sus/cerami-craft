module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  testMatch: [
    '**/__tests__/**/*.test.ts?(x)',
    '**/__tests__/**/*.test.js?(x)',
    '**/?(*.)+(spec|test).ts?(x)',
    '**/?(*.)+(spec|test).js?(x)',
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    'app/**/*.{ts,tsx,js,jsx}',
    'components/**/*.{ts,tsx,js,jsx}',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|@react-navigation|@react-native-async-storage|@react-native-firebase|expo|expo-.*|@expo-.*|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|zustand|@babel/runtime|expo-modules-core)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/build/', '/.expo/', '/dist/'],
};

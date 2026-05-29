export default {
  displayName: '@hancr/sos',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.base.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper: {
    '^@hancr/database$': '<rootDir>/libs/database/src/index.ts',
    '^@hancr/notifications$': '<rootDir>/libs/notifications/src/index.ts',
  },
  rootDir: '../..',
  testMatch: ['<rootDir>/libs/sos/**/*.spec.ts'],
  coverageDirectory: '<rootDir>/coverage/libs/sos',
};

export default {
  displayName: 'driver-api',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.base.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper: {
    '^@hancr/database$': '<rootDir>/libs/database/src/index.ts',
    '^@hancr/notifications$': '<rootDir>/libs/notifications/src/index.ts',
    '^@hancr/wallet$': '<rootDir>/libs/wallet/src/index.ts',
    '^@hancr/sos$': '<rootDir>/libs/sos/src/index.ts',
    '^@hancr/redis$': '<rootDir>/libs/redis/src/index.ts',
    '^@hancr/observability$': '<rootDir>/libs/observability/src/index.ts',
  },
  rootDir: '../..',
  testMatch: ['<rootDir>/apps/driver-api/**/*.spec.ts'],
  coverageDirectory: '<rootDir>/coverage/apps/driver-api',
};

export default {
  displayName: '@hancr/wallet',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.base.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper: {
    '^@hancr/database$': '<rootDir>/libs/database/src/index.ts',
  },
  rootDir: '../..',
  testMatch: ['<rootDir>/libs/wallet/**/*.spec.ts'],
  coverageDirectory: '<rootDir>/coverage/libs/wallet',
};

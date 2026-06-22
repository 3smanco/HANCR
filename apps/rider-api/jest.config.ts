export default {
  displayName: 'rider-api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper: {
    '^@hancr/database$': '<rootDir>/../../libs/database/src/index.ts',
    '^@hancr/notifications$': '<rootDir>/../../libs/notifications/src/index.ts',
    '^@hancr/observability$': '<rootDir>/../../libs/observability/src/index.ts',
  },
  coverageDirectory: '../../coverage/apps/rider-api',
};

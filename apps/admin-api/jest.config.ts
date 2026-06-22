// خرائط مسارات @hancr/* لجِست (ts-jest لا يقرأ paths من tsconfig تلقائياً).
const libs = [
  'database',
  'redis',
  'order',
  'geo',
  'notifications',
  'sdui',
  'wallet',
  'sos',
  'observability',
];

const hancrMapper: Record<string, string> = {};
for (const l of libs) {
  hancrMapper[`^@hancr/${l}$`] = `<rootDir>/../../libs/${l}/src/index.ts`;
  hancrMapper[`^@hancr/${l}/(.*)$`] = `<rootDir>/../../libs/${l}/src/lib/$1`;
}

export default {
  displayName: 'admin-api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  moduleNameMapper: hancrMapper,
  coverageDirectory: '../../coverage/apps/admin-api',
};

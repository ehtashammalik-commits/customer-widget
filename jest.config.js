module.exports = {
    preset: 'jest-preset-angular',
    setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
    testMatch: ['**/*.steps.ts'],
    testEnvironment: 'jsdom',
    transform: {
      '^.+\\.(ts|js|html)$': [
        'ts-jest',
        {
          tsconfig: '<rootDir>/tsconfig.spec.json',
          stringifyContentPathRegex: '\\.html$',
          isolatedModules: true,
          useESM: true
        }
      ]
    },
    transformIgnorePatterns: [
      'node_modules/(?!@angular|@ngx-translate|rxjs)'
    ],
    moduleNameMapper: {
       '^src/(.*)$': '<rootDir>/src/$1'
      }
      
  };
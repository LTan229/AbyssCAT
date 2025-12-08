module.exports = {
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'CommonJS', 
        },
      },
    ],
  },
  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

};
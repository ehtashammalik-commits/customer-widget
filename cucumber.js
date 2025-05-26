module.exports = {
    default: {
      require: ['test/step-definitions/**/*.ts'],
      format: ['progress'],
      paths: ['test/features/**/*.feature'],
      publishQuiet: true,
      requireModule: ['ts-node/register'],
    }
  };

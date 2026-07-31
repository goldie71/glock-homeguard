const { withGradleProperties } = require('expo/config-plugins');

module.exports = function(config) {
  return withGradleProperties(config, (config) => {
    config.modResults.properties = config.modResults.properties || [];
    config.modResults.properties.push({
      key: 'org.gradle.java.home',
      value: '/usr/lib/jvm/java-17-openjdk-amd64',
    });
    return config;
  });
};

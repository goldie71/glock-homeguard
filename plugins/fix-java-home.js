const { withDangerousMod } = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const gradlePropsPath = path.join(config.modRequest.projectRoot, 'android', 'gradle.properties');
      let content = '';
      if (fs.existsSync(gradlePropsPath)) {
        content = fs.readFileSync(gradlePropsPath, 'utf8');
      }
      // Try multiple Java paths
      const javaPaths = [
        '/usr/lib/jvm/java-17-openjdk-amd64',
        '/usr/lib/jvm/java-17-openjdk-arm64',
        '/usr/lib/jvm/java-17',
        '/usr/lib/jvm/java-22-openjdk-amd64',
        '/usr/local/lib/java',
      ];
      for (const javaPath of javaPaths) {
        if (!content.includes('org.gradle.java.home')) {
          content += `\norg.gradle.java.home=${javaPath}\n`;
        }
      }
      fs.writeFileSync(gradlePropsPath, content);
      console.log('G-Lock: Written org.gradle.java.home to gradle.properties');
      return config;
    },
  ]);
};

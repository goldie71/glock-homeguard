#!/bin/bash
echo "=== G-LOCK BUILD HOOK: Finding Java 17+ ==="

# Find all Java installations
JAVA_DIRS=$(find /usr/lib/jvm -maxdepth 1 -type d 2>/dev/null | sort)
echo "Available Java installations:"
echo "$JAVA_DIRS"

# Find Java 17 or higher
JAVA_HOME_NEW=""
for dir in $JAVA_DIRS; do
  if [ -f "$dir/bin/java" ]; then
    VERSION=$("$dir/bin/java" -version 2>&1 | head -1 | awk -F '"' '{print $2}' | awk -F '.' '{print $1}')
    echo "Found: $dir (Java $VERSION)"
    if [ "$VERSION" -ge 17 ] 2>/dev/null; then
      JAVA_HOME_NEW="$dir"
      echo "Selected Java $VERSION at $dir"
      break
    fi
  fi
done

if [ -z "$JAVA_HOME_NEW" ]; then
  echo "No Java 17+ found, trying JAVA_HOME..."
  if [ -n "$JAVA_HOME" ] && [ -f "$JAVA_HOME/bin/java" ]; then
    VERSION=$("$JAVA_HOME/bin/java" -version 2>&1 | head -1 | awk -F '"' '{print $2}' | awk -F '.' '{print $1}')
    if [ "$VERSION" -ge 17 ] 2>/dev/null; then
      JAVA_HOME_NEW="$JAVA_HOME"
    fi
  fi
fi

if [ -n "$JAVA_HOME_NEW" ]; then
  echo "Setting JAVA_HOME=$JAVA_HOME_NEW"
  export JAVA_HOME="$JAVA_HOME_NEW"
  
  # Write to gradle.properties in the android build directory
  ANDROID_DIR="/home/expo/workingdir/build/android"
  if [ -d "$ANDROID_DIR" ]; then
    echo "org.gradle.java.home=$JAVA_HOME_NEW" >> "$ANDROID_DIR/gradle.properties"
    echo "Written to $ANDROID_DIR/gradle.properties"
  fi
  
  # Also write to any gradle.properties we can find
  find /home/expo/workingdir -name "gradle.properties" -exec sh -c "echo 'org.gradle.java.home=$JAVA_HOME_NEW' >> {}" \; 2>/dev/null
  
  # Update system alternatives
  update-alternatives --set java "$JAVA_HOME_NEW/bin/java" 2>/dev/null || true
  update-alternatives --set javac "$JAVA_HOME_NEW/bin/javac" 2>/dev/null || true
  
  echo "=== JAVA_HOME set to $JAVA_HOME_NEW ==="
else
  echo "ERROR: No Java 17+ found on system!"
  echo "Attempting to install OpenJDK 17..."
  apt-get update -qq && apt-get install -y -qq openjdk-17-jdk 2>/dev/null || true
  export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
fi

module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'react-native-worklets/plugin', // required by Reanimated v4+
  ],
};

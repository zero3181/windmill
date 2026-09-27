/**
 * iOS 27부터 UIScene 라이프사이클을 쓰지 않는 앱은 실행 즉시 종료된다.
 * Expo SDK 57에 들어 있는 ExpoAppSceneDelegate를 씬 델리게이트로 등록하고,
 * React Native 시작을 AppDelegate에서 씬 델리게이트로 넘긴다.
 * (SDK 57 prebuild 템플릿이 아직 이 설정을 만들지 않아서 필요하다.)
 */
const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

const START_BLOCK = /\n#if os\(iOS\) \|\| os\(tvOS\)\n\s*window = UIWindow\(frame: UIScreen\.main\.bounds\)\n\s*factory\.startReactNative\([\s\S]*?\)\n#endif\n/;

function withSceneLifecycle(config) {
  config = withInfoPlist(config, (cfg) => {
    cfg.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: 'EXExpoAppSceneDelegate',
          },
        ],
      },
    };
    return cfg;
  });

  return withAppDelegate(config, (cfg) => {
    if (cfg.modResults.language !== 'swift') {
      throw new Error('withSceneLifecycle: Swift AppDelegate만 지원해요');
    }
    let src = cfg.modResults.contents;
    if (!src.includes('ExpoReactNativeFactoryProvider')) {
      src = src.replace('class AppDelegate: ExpoAppDelegate {', 'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {');
    }
    if (START_BLOCK.test(src)) {
      src = src.replace(START_BLOCK, '\n    // 창 생성과 React Native 시작은 ExpoAppSceneDelegate가 한다.\n');
    } else if (src.includes('factory.startReactNative(')) {
      throw new Error('withSceneLifecycle: AppDelegate의 startReactNative 블록을 찾지 못했어요');
    }
    cfg.modResults.contents = src;
    return cfg;
  });
}

module.exports = withSceneLifecycle;

/**
 * Android '굵은 글꼴' 설정(Android 12+ fontWeightAdjustment)을 앱 화면에서만 끈다.
 * React Native는 글자 너비를 원래 굵기로 재고 시스템은 더 굵게 그려서, 공간이 남아도
 * "D-340"이 "D-3…", "4월"이 "4"처럼 끝이 잘린다. 굵기 보정을 0으로 두면 잰 너비와 그린 너비가 같아진다.
 * 큰 글자(fontScale)는 그대로 따른다.
 */
const { withMainActivity } = require('expo/config-plugins');

const MARK = 'fontWeightAdjustment';

const METHOD = `
  // '굵은 글꼴' 설정에서 글자가 잘리지 않게 굵기 보정을 끈다 (plugins/withFixedFontWeight.js)
  override fun attachBaseContext(newBase: Context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
        newBase.resources.configuration.fontWeightAdjustment != 0) {
      val config = Configuration(newBase.resources.configuration)
      config.fontWeightAdjustment = 0
      super.attachBaseContext(newBase.createConfigurationContext(config))
    } else {
      super.attachBaseContext(newBase)
    }
  }
`;

module.exports = function withFixedFontWeight(config) {
  return withMainActivity(config, (cfg) => {
    if (cfg.modResults.language !== 'kt') {
      throw new Error('withFixedFontWeight: Kotlin MainActivity만 지원해요');
    }
    let src = cfg.modResults.contents;
    if (src.includes(MARK)) return cfg;
    src = src.replace('import android.os.Build\n', 'import android.content.Context\nimport android.content.res.Configuration\nimport android.os.Build\n');
    src = src.replace(/class MainActivity : ReactActivity\(\) \{\n/, (m) => m + METHOD);
    if (!src.includes(MARK)) throw new Error('withFixedFontWeight: MainActivity를 고치지 못했어요');
    cfg.modResults.contents = src;
    return cfg;
  });
};

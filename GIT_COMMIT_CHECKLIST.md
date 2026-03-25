# Git 提交清单

本文档用于当前这次 Android 发版前的提交确认。

## 可以直接提交的文件

- `.github/workflows/capacitor-mobile-build.yml`
- `wuxue-app/capacitor.config.json`
- `wuxue-app/android/app/src/main/res/values/strings.xml`
- `wuxue-app/android/app/src/main/res/mipmap-mdpi/*`
- `wuxue-app/android/app/src/main/res/mipmap-hdpi/*`
- `wuxue-app/android/app/src/main/res/mipmap-xhdpi/*`
- `wuxue-app/android/app/src/main/res/mipmap-xxhdpi/*`
- `wuxue-app/android/app/src/main/res/mipmap-xxxhdpi/*`
- `res/drawable/icon.png`
- `ANDROID_RELEASE_AND_HOT_UPDATE_GUIDE.md`

## 按需决定是否提交的数据文件

如果这次 APK 要带上最新数据，则提交：

- `data/activeZhao.json.gz`
- `data/skill.json.gz`
- `data/skillAuto.json.gz`
- `data/version.json`

如果这次只发应用名、图标、工作流和文档调整，不想把数据一并发出去，则先不要提交这些文件。

## 不建议提交的内容

- `icon.png`
- `wuxue-app/node_modules`
- `wuxue-app/www`
- `wuxue-app/android/.gradle`
- `wuxue-app/android/app/build`

## 说明

- GitHub Actions 会自动执行 `npm ci`、`npm run build`、`npx cap sync android`
- 本地已经删除的缓存和构建目录不影响 GitHub Actions 构建
- Android 签名所需 4 个 GitHub Secrets 已经配置后，就可以直接推送触发工作流

## 推荐提交命令

```powershell
git add .github/workflows/capacitor-mobile-build.yml
git add wuxue-app/capacitor.config.json
git add wuxue-app/android/app/src/main/res/values/strings.xml
git add wuxue-app/android/app/src/main/res/mipmap-*
git add res/drawable/icon.png
git add ANDROID_RELEASE_AND_HOT_UPDATE_GUIDE.md
```

如果这次连数据也一起提交，再执行：

```powershell
git add data/activeZhao.json.gz data/skill.json.gz data/skillAuto.json.gz data/version.json
```

## 推荐推送流程

```powershell
git status
git commit -m "release: update android app assets and workflow"
git push origin main
```

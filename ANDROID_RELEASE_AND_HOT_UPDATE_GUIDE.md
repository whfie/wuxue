# Android 发版与热更新指南

本文档是当前仓库唯一保留的 Android 相关说明，统一覆盖 GitHub Actions 发包、数据更新和热更新测试流程。

## 当前结论

- Android 主流程是 GitHub Actions 自动构建，不以本地手工打包为主
- 应用显示名称为 `武学查询`
- Android 构建产物名称为 `武学查询.apk` 和 `武学查询.aab`
- Android 图标来源于 `res/drawable/icon.png`
- Android 采用“只热更新数据，不热更新页面代码”的方案
- 页面代码更新必须重新发 APK
- 数据更新可以通过线上 `data/` 和 `data/version.json` 触发 Android 端拉新
- 当前热更新逻辑已支持按 `version.json.files` 分文件更新

## 关键目录和文件

- 根目录数据：`data/`
- 图标原图：`res/drawable/icon.png`
- Capacitor 包装层：`wuxue-app/`
- Web 构建脚本：`wuxue-app/scripts/build-web.mjs`
- Android 应用名：`wuxue-app/android/app/src/main/res/values/strings.xml`
- Android 图标资源：`wuxue-app/android/app/src/main/res/mipmap-*`
- Android 远程源配置：`js/runtimeConfig.js`
- 热更新缓存逻辑：`js/db.js`
- 技能页数据加载逻辑：`js/modules/wuxe/dataLoader.js`
- Android 构建工作流：`.github/workflows/capacitor-mobile-build.yml`

## GitHub Actions Android 发包流程

当前 Android 工作流会按下面顺序执行：

1. 拉取仓库代码
2. 安装 Node.js 和 Java
3. 执行 `npm ci`
4. 执行 `npm run build`
5. 执行 `npx cap sync android`
6. 读取签名证书相关 Secrets
7. 执行 `./gradlew assembleRelease bundleRelease`
8. 将产物重命名为 `武学查询.apk` 和 `武学查询.aab`
9. 上传 GitHub Actions Artifact
10. 如果是 `v*` tag，则上传到 GitHub Release

### 工作流触发规则

- 手动触发：`workflow_dispatch`
- 推送到 `main`
- 推送到 `master`
- 推送 `v*` tag
- `pull_request`

### 构建前提

GitHub 仓库必须配置以下 Secrets，否则 Android Release 构建会失败：

- `ANDROID_KEYSTORE_BASE64`
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

### 标准发版流程

```powershell
git add .
git commit -m "release: update android app"
git push origin main
git tag v1.0.5
git push origin v1.0.5
```

工作流成功后，可以从两个地方拿包：

- GitHub Actions 的 `android-release-artifacts`
- GitHub Release 附件

产物文件名为：

- `武学查询.apk`
- `武学查询.aab`

### 注意事项

- GitHub Actions 只会打包已经提交并推送的内容
- 本地未提交改动不会进入线上构建产物
- 如果工作流失败，先优先检查 Secrets、签名文件和 Gradle 构建日志

## 本地目录精简说明

`wuxue-app` 下这些内容都可以删除，因为都能重新生成：

- `wuxue-app/node_modules`
- `wuxue-app/www`
- `wuxue-app/android/.gradle`
- `wuxue-app/android/app/build`

保留 Android 工程源码即可，GitHub Actions 会在构建时自动恢复依赖并重新产出结果。

## Android 热更新数据源顺序

Android 运行时按下面顺序尝试获取最新数据：

1. `https://buzhidao159.netlify.app/`
2. `https://buzhidao32.github.io/wuxue/`
3. `https://cdn.jsdelivr.net/gh/buzhidao32/wuxue@main/`
4. APK 内置数据

如果要改远程源，只需要修改 `js/runtimeConfig.js` 里的 `DEFAULT_REMOTE_BASE_URLS`。

## version.json 现在怎么用

当前会同时使用两层版本信息：

```json
{
  "version": "2026.03.25",
  "files": {
    "skill.json": "2026.03.25",
    "activeZhao.json": "2026.03.25",
    "skillAuto.json": "2026.03.25"
  }
}
```

- 顶层 `version` 继续保留，作为整体版本标记
- `files` 用来判断每个数据文件是否需要单独更新
- 只有待更新文件全部成功后，新的 `version.json` 才会写入本地缓存

## 只更新网页端数据

如果只是网页端使用最新数据：

1. 更新根目录 `data/`
2. 同步更新 `data/version.json`
3. 部署网页端数据源

网页端直接读取根目录 `data/`，不需要执行 Android 构建命令。

## 本地同步 Android 资源

如果只是想把当前根目录网页资源和数据同步到 Android 工程：

```powershell
Set-Location D:\Desktop\fzjh_backup\Special_Package\wuxue-main\wuxue-app
npm ci
npm run build
npx cap sync android
```

这几步会完成：

- 安装本地依赖
- 将根目录网页资源复制到 `wuxue-app/www`
- 将 `data/*.json.gz` 解压成 APK 使用的 `.json`
- 同步到 Android 工程资源目录

注意：

- 本地直接同步时，会带上你当前本地根目录里的 `data/`
- 如果你本地 `data/` 是未提交的新数据，那么本地同步出的 Android 资源也会带新数据

## 想先发旧数据 APK，再测热更新怎么做

这是比较安全的测试流程：

1. 保持本地新 `data/` 不提交
2. 只把页面代码或热更新逻辑提交并推送到 `main`
3. 打一个新 tag 触发 GitHub Release
4. 用这个 APK 安装测试
5. 再把本地新 `data/` 上传到线上数据源
6. 确保线上 `data/version.json` 比 APK 当前缓存版本更新
7. Android 端联网重开 App 测试热更新

这样做的结果：

- APK 内置的是仓库里已提交的数据
- 线上放的是你本地测试数据
- 可以单独验证“旧包拉新数据”的热更新效果

## 同步云端代码，但保留本地 data

如果远端 `main` 更新了，而你本地 `data/` 还不想提交：

```powershell
git stash push -u -m "temp-sync-without-data"
git fetch origin
git rebase origin/main
git stash pop
```

如果 `stash pop` 在 `data/version.json` 或 `data/*.json.gz` 上冲突，处理原则是：

- 代码跟远端走
- 本地测试数据保留你自己的版本

## 热更新测试重点

测试时重点看这几件事：

1. 首屏技能列表能否正常出来
2. 热更新后再次进入是否明显更快
3. 点开技能详情时，主动技能和被动技能是否还能正常显示
4. 只改某一个文件时，是否只拉取对应文件

## 不要提交到 Git 的内容

- `wuxue-release.jks`
- `keystore.base64`
- 本地测试图片或临时文件
- 你还不想发布的 `data/` 改动

## 维护原则

以后只维护这份文档，其他 Android 说明不要再拆分新增，避免流程重复和内容漂移。

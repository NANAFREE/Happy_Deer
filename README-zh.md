## 针对安卓系统的单个任务时间管理项目

<p align="center">
 <img src="docs_assets/default.jpg" alt="logo" width="240px">
</p>

<p align="center">
    <img src="docs_assets/Java.png" alt="Java" width="120px"/>
    <img src="docs_assets/Android.png" alt="Android" width="120px">
    <img src="docs_assets/GitHub.png" alt="Github" width="120px">
    <img src="docs_assets/HTML.png" alt="HTML" width="120px">
    <img src="docs_assets/React.png" alt="HTML" width="120px">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/XML-005C0F?style=for-the-badge&logo=xml&logoColor=white" alt="XML">
  <img src="https://img.shields.io/badge/Gradle-02303A?style=for-the-badge&logo=gradle&logoColor=white" alt="Gradle">
  <img src="https://img.shields.io/badge/Room-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Room">
  <img src="https://img.shields.io/badge/Retrofit-48B983?style=for-the-badge&logo=square&logoColor=white" alt="Retrofit">
  <img src="https://img.shields.io/badge/OkHttp-3E4348?style=for-the-badge&logo=square&logoColor=white" alt="OkHttp">
  <img src="https://img.shields.io/badge/NanoHTTPD-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="NanoHTTPD">
  <img src="https://img.shields.io/badge/MPAndroidChart-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="MPAndroidChart">
</p>

<p align="center">
<a href="README.md">English</a> | <a href="README-zh.md"> 简体中文 (Simplified Chinese) </a> | <a href="README-ja.md"> 日本語 (Japanese) </a> | <a href="README-kokr.md"> 한국어 (Korean) </a>
</p>

## 关于
该项目的主要功能是记录单个任务的执行时间，显示间隔时间，并最终分析数据以形成统计表。


## 主要功能
- 用户只需点击一个按钮即可完成记录，无需其他操作
- 分析数据并编制统计，形成每周、每月和每年的报告
- 在主页上清晰地显示记录状态，以保持合理的规律习惯
- 丰富的模式和主题以应对不同情况

## 安装

```bash
git clone https://github.com/Blackcat-love/Happy_Deer.git
```
打开Android studio 将项目导入进去

## 提交issues前的注意

请阅读 https://lug.ustc.edu.cn/wiki/doc/smart-questions/ 来让你的问题更加智慧

## 待做
- [x] 添加开发者页面.
- [x] 添加主题功能，以便在不同主题之间切换.
- [ ] 添加默认模式，例如个人模式和夫妻模式.
- [x] 多语言支持.
- [x] 清理缓存.
- [ ] 关于宣传和推广的问题于解决方案.
- [x] 数据的导入导出
- [x] 可以自定义text_hp的判断
- [x] 利用github release实现客户端程序的版本控制和自动更新
- [ ] 一键分享

## 版本更新
### [1.4.2] - 2024-10-1
- **Added**: 添加了新的主题设置和图标
- **Optimized**: 重新构建了底层的TextView加载代码，方便自定义
- **Fixed** 修复了部分页面背景黑色的问题

### [1.0.2] - 2024-09-19
- **Added**: 添加了新的样式设置 阈值时间 主页背景设置 侧边栏背景设置
- **Added** 添加了用于自动检查版本号来确认更新
- **Fixed** 若干修复

### [1.0.1] - 2024-09-14
- **Added**: 添加了样式设置的功能
- **Optimized**: 重新设计了主页布局，统一字体大小和布局大小
- **Fixed** 修复完善了多语言适配的问题

### [1.0.0] - 2024-09-12
- **Added**: 添加了README文档，并发布第一个测试版本.
- **Optimized**: 重新设计了主页布局，以提高可用性，同时保持相同的视觉外观.
- **Fixed** 修复了主页侧边栏触摸时无响应的问题，以及点击按钮后无响应的问题.

## 目前问题
- 关于多语言自定义切换，需要增加java端代码，将所有TextView的Text在JAVA端动态绑定Values/strings,然后添加一个判断条件保存在本地，这样才可以实现自定义语言的切换且保证下次启动还是一样的语言。
- 切换背景如果过暗因为文字也是黑色导致看不清楚，需要一个检测判断当背景色调过暗后切换白色文字反之切换黑色。

## 有趣想法
- 我想要添加一个主题，是关于Vedal和Neuro,后续可能还有整个社群的设计元素

## 贡献
欢迎贡献，感谢所有人

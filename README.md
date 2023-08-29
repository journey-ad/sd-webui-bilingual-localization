[中文文档](README_ZH.md) / [日本語](README_JA.md)

<p align="center"><img src="https://count.getloli.com/get/@sd-webui-bilingual-localization.github" alt="sd-webui-bilingual-localization"></p>

# sd-webui-bilingual-localization
[Stable Diffusion web UI](https://github.com/AUTOMATIC1111/stable-diffusion-webui) bilingual localization extensions.

![Snipaste_2023-03-30_01-05-45](https://user-images.githubusercontent.com/16256221/228617304-3107244b-ce13-4b96-b665-1d13090d24a7.png)

## Features
- Bilingual translation, no need to worry about how to find the original button.
- Compatible with language pack extensions, no need to re-import.
- Support dynamic translation of title hints.
- Additional support Scoped and RegExp pattern, more flexible translation.

## Installation

Choose one of the following methods, Need to use webui with extension support <sup>(Versions after 2023)</sup>

#### Method 1

Use the `Install from URL` provided by webui to install

Click in order <kbd>Extensions</kbd> - <kbd>Install from URL</kbd>

Then fill in the first text box with `https://github.com/journey-ad/sd-webui-bilingual-localization`, click the <kbd>Install</kbd> button.

![Snipaste_2023-02-28_00-27-48](https://user-images.githubusercontent.com/16256221/221625310-a6ef0b4c-a1e0-46bb-be9c-6d88cd0ad684.png)

After that, switch to the <kbd>Installed</kbd> panel and click the <kbd>Apply and restart UI</kbd> button.

![Snipaste_2023-02-28_00-29-14](https://user-images.githubusercontent.com/16256221/221625345-9e656f25-89dd-4361-8ee5-f4ab39d18ca4.png)


#### Method 2

Clone to your extension directory manually.

```bash
git clone https://github.com/journey-ad/sd-webui-bilingual-localization extensions/sd-webui-bilingual-localization
```

## Usage

> **⚠️Important⚠️**   
> Make sure <kbd>Settings</kbd> - <kbd>User interface</kbd> - <kbd>Localization</kbd> is set to `None`

In <kbd>Settings</kbd> - <kbd>Bilingual Localization</kbd> panel, select the localization file you want to enable and click on the <kbd>Apply settings</kbd> and <kbd>Reload UI</kbd> buttons in turn.

![Snipaste_2023-02-28_00-04-21](https://user-images.githubusercontent.com/16256221/221625729-73519629-8c1f-4eb5-99db-a1d3f4b58a87.png)

## Scoped

Localization supports scoped to prevent global polluting. The syntax rules are as follows:
- `##<SCOPE ID>##<TEXT>` Scoped text will only take effect when the ancestor element ID matches the specified scope.
- `##@<SELECTOR>##<TEXT>` Scoped text will only take effect when the ancestor element matches the specified CSS selector.

```json
{
  ...
  "##tab_ti##Normal": "正态", // only the text `Normal` under the element with id="tab_ti" will be translated to `正态`.
  "##tab_threedopenpose##Normal": "法线图", // only the text `Normal` under the element with id="tab_threedopenpose" will be translated to `法线图`.
  "##@.extra-networks .tab-nav button##Lora": "Lora模型", // only the text `Lora` under the element with class=".extra-networks .tab-nav button" will be translated to `Lora模型`.
  ...
}
```

## RegExp pattern

Localization support RegExp pattern, syntax rule is `@@<REGEXP>`, capturing group is `$n`, doc: [String.prototype.replace()](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String/replace)
```json
{
  ...
  "@@/^(\\d+) images in this directory, divided into (\\d+) pages$/": "目录中有$1张图片，共$2页",
  "@@/^Favorites path from settings: (.*)$/": "设置的收藏夹目录：$1",
  ...
}
```

## How to get localization file

Localization files are no longer provided with the plugin, please install a third-party language extensions and set-up as described in the [Usage](#usage) section of this article.

[English Version](README.md)

<p align="center"><img src="https://count.getloli.com/get/@sd-webui-bilingual-localization.github" alt="sd-webui-bilingual-localization"></p>

# sd-webui-bilingual-localization
[Stable Diffusion web UI](https://github.com/AUTOMATIC1111/stable-diffusion-webui)のバイリンガル対応拡張機能

![Snipaste_2023-02-28_00-23-45](https://user-images.githubusercontent.com/16256221/221622328-a4e46b1c-f202-4a41-9a56-3df96c823f42.png)

## 特徴
- バイリンガル対応により、元のボタンを探す必要がありません。
- 日本語化拡張機能と互換性があり、ファイルを取り込み直す必要はありません。
- ツールチップの動的翻訳をサポートします。
- 正規表現パターンによる柔軟な翻訳が可能です。

## インストール

以下の方法から選択します。
拡張機能に対応したWebUI<sup>(2023年以降のバージョン)</sup>が必要です。

#### 方法1

WebUIの`Install from URL`でインストールを行います。

<kbd>Extensions</kbd> - <kbd>Install from URL</kbd>を順にクリックします。

1個目のテキストボックスに`https://github.com/journey-ad/sd-webui-bilingual-localization`を入力し、<kbd>Install</kbd>ボタンをクリックします。

![Snipaste_2023-02-28_00-27-48](https://user-images.githubusercontent.com/16256221/221625310-a6ef0b4c-a1e0-46bb-be9c-6d88cd0ad684.png)

その後、<kbd>Installed</kbd>パネルに切り替え、<kbd>Apply and restart UI</kbd>ボタンをクリックします。

![Snipaste_2023-02-28_00-29-14](https://user-images.githubusercontent.com/16256221/221625345-9e656f25-89dd-4361-8ee5-f4ab39d18ca4.png)


#### 方法2

拡張機能のディレクトリに手動でcloneします。

```bash
git clone https://github.com/journey-ad/sd-webui-bilingual-localization extensions/sd-webui-bilingual-localization
```

## 使用方法

> **⚠️重要⚠️**  
> <kbd>Settings</kbd> - <kbd>User interface</kbd> - <kbd>Localization</kbd>が`None`に設定されていることを確認してください。

<kbd>Settings</kbd> - <kbd>Bilingual Localization</kbd>パネルで、有効にしたい言語ファイル名を選択し、<kbd>Apply settings</kbd>ボタンと<kbd>Reload UI</kbd>ボタンを順にクリックします。

![Snipaste_2023-02-28_00-04-21](https://user-images.githubusercontent.com/16256221/221625729-73519629-8c1f-4eb5-99db-a1d3f4b58a87.png)

## 正規表現パターン

日本語化では正規表現パターンがサポートされます。構文ルールは`@@<REGEXP>`、キャプチャグループは`$n`です。ドキュメント：[String.prototype.replace()](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String/replace)。
```json
{
  ...
  "@@/^(\\d+) images in this directory, divided into (\\d+) pages$/": "このディレクトリには$1枚の画像、$2ページ",
  "@@/^Favorites path from settings: (.*)$/": "お気に入りのディレクトリパス：$1",
  ...
}
```

## 日本語化ファイルの取得

内蔵の日本語化ファイルは提供されなくなりました。サードパーティー製の日本語化拡張機能をインストールし、当ページの[使用方法](#使用方法)に記載されている方法でセットアップしてください。
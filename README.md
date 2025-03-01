# マネーサプリ - 金融学習アプリケーション

マネーサプリは、株式投資や投資信託などの金融知識を効果的に学ぶための初心者向けWebアプリケーションです。実践的な知識提供とシミュレーション機能を備え、ユーザーが楽しみながら金融リテラシーを高められる環境を提供します。

## 🔧 インストールと使用方法

### ローカル開発環境のセットアップ

```bash
# リポジトリのクローン
git clone https://github.com/souta-pqr/money-suppli.git
cd money-suppli

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm start
```

アプリケーションは http://localhost:3000 で実行されます。

### ビルドと本番用デプロイ

```bash
# プロジェクトのビルド
npm run build

# GitHub Pagesへのデプロイ
npm run deploy
```

または、提供されているデプロイスクリプトを使用することもできます：

```bash
./deploy.sh
```

## 💡 プロジェクト構造

```
money-suppli/
├── public/               # 静的ファイル
├── src/                  # ソースコード
│   ├── assets/           # 画像等の静的アセット
│   ├── components/       # Reactコンポーネント
│   │   ├── common/       # 共通コンポーネント
│   │   ├── layout/       # レイアウト関連
│   │   └── pages/        # ページコンポーネント
│   ├── context/          # Reactコンテキスト
│   ├── data/             # 静的データ
│   ├── hooks/            # カスタムフック
│   ├── routes/           # ルーティング
│   └── services/         # ユーティリティ/サービス
├── package.json          # 依存関係と設定
└── tailwind.config.js    # Tailwind CSS設定
```

## 📱 デモ

アプリケーションのライブデモは以下のURLで確認できます：
[https://souta-pqr.github.io/money-suppli/](https://souta-pqr.github.io/money-suppli/)


## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

---

お金と投資について楽しく学び、実践的なスキルを身につけましょう！
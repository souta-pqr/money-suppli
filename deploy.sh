#!/bin/bash

# マネーサプリ GitHubページデプロイスクリプト

echo "🚀 マネーサプリのデプロイを開始します..."

# 最新の依存関係をインストール
echo "📦 依存関係をインストールしています..."
npm install

# テストの実行（オプション）
# echo "🧪 テストを実行しています..."
# npm test

# ビルドの実行
echo "🔨 プロジェクトをビルドしています..."
npm run build

# GitHub Pagesへのデプロイ
echo "🌐 GitHub Pagesにデプロイしています..."
npm run deploy

echo "✅ デプロイが完了しました！"
echo "📱 以下のURLでアプリにアクセスできます："
echo "https://souta-pqr.github.io/money-suppli/"
module.exports = {
    // テスト環境を指定
    testEnvironment: 'jsdom',
    
    // テスト対象のファイルパターン
    testMatch: [
      "<rootDir>/src/**/__tests__/**/*.{js,jsx}",
      "<rootDir>/src/**/*.{spec,test}.{js,jsx}"
    ],
    
    // トランスフォーマーの設定
    transform: {
      "^.+\\.(js|jsx)$": "babel-jest"
    },
    
    // モジュール名のエイリアス設定
    moduleNameMapper: {
      // CSSファイルのモック
      "\\.(css|less|scss|sass)$": "identity-obj-proxy",
      // 画像ファイルのモック
      "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/src/__mocks__/fileMock.js"
    },
    
    // テストファイルのセットアップファイル
    setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
    
    // カバレッジの設定
    collectCoverageFrom: [
      "src/**/*.{js,jsx}",
      "!src/**/*.d.ts",
      "!src/index.js",
      "!src/reportWebVitals.js",
      "!src/serviceWorker.js"
    ],
    
    // カバレッジディレクトリ
    coverageDirectory: "coverage",
    
    // カバレッジのしきい値設定
    coverageThreshold: {
      global: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70
      }
    }
  };
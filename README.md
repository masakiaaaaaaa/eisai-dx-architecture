# 🏫 個別指導塾DXエコシステム アーキテクチャ・リファレンス
> **Next.js 16 (App Router) × Chrome Extension (Manifest V3) × PostgreSQL / Prisma ORM × LINE Messaging API**  
> 現場の業務制約を解決する「3層ハイブリッド・リアルタイムDXシステム」の設計思想と実装完全リファレンス

---

## 📖 概要（Overview）

本リポジトリは、現役個別指導塾の現場における複雑な業務摩擦（フロー情報の蒸発、座席ブース割り当ての制約充足問題、既存レガシーシステムとのDOM競合、非同期排他制御）を解決するために設計・実装された**3層ハイブリッドDXエコシステムの完全アーキテクチャ・リファレンス**です。

技術者がシステムの全体像、コンポーネント間のデータパルス、設計判断の根拠を100%理解できるよう、**ソースコード、アルゴリズム、ローカル動作環境、および完全技術解剖書（C4モデル解説）**をパッケージ化しています。

> [!NOTE]
> 本リポジトリ内のデータ（生徒名・学校名・トークン等）はすべて**100%安全なモックデータ**に置き換えられており、本番データベースや個人情報からは完全に独立しています。

---

## 🏛️ システム全体構成（C4 Container Model）

本システムは、クライアント層・サーバー層・データ永続化層・外部インフラの4コンポーネント群から構成される**3層ハイブリッド構成**です。

```mermaid
graph TD
    subgraph Client["クライアント層 (Client Layer)"]
        Ext["Chrome拡張機能 (Manifest V3)<br/>・Content Script DOM注入<br/>・MutationObserver 属性監視<br/>・座席表UIオーバーレイ"]
        AdminWeb["管理Webアプリ (Next.js 16 App Router)<br/>・生徒カルテ / テスト日程マトリクス<br/>・座席自動割り当てUI (Tailwind CSS)"]
        LineApp["講師LINEアプリ (スマートフォン)<br/>・週次Flex Message レポート受信<br/>・未回収過去問タスク通知"]
    end

    subgraph Server["サーバー / API層 (Next.js 16 Route Handlers)"]
        API["Next.js Route Handlers (Edge/Node)<br/>・/api/students (生徒CRUD)<br/>・/api/extension/* (拡張機能連携)<br/>・CORS & Session Auth"]
        CronService["Vercel Cron Service<br/>・/api/cron/weekly<br/>・毎週月曜 定期集計・配信トリガー"]
    end

    subgraph Data["データ永続化層 (Database Layer)"]
        DB[(PostgreSQL / Supabase)<br/>・Prisma ORM<br/>・マルチテナント (CampusId分離)<br/>・非正規化JSONカラム]
    end

    subgraph External["外部連携インフラ (External Services)"]
        LineAPI["LINE Messaging API<br/>・マルチキャストPush配信<br/>・Webhook対話処理"]
    end

    Ext -->|"CORS Preflight + REST (Bearer Auth)"| API
    AdminWeb -->|"Server Actions / Route Handlers"| API
    CronService -->|"Internal Cron Trigger"| API
    API -->|"Prisma Connection Pool"| DB
    API -->|"Push Message SDK"| LineAPI
    LineAPI -->|"Flex Message Delivery"| LineApp
```

---

## 💡 主要な技術的ハイライト（Core Technical Concepts）

### 1. 既存レガシーDOMとの共存と競合制御（Race Condition Defense）
* **課題**: 既存の塾管理システム（ASP型Web）上で講師が座席カードをドラッグ＆ドロップした際、拡張機能の `MutationObserver` が過剰発火し、DOM要素が画面から消失する競合状態が発生。
* **解決策**:
  1. **クラス属性監視**: jQuery UI がドラッグ中に付与する `.ui-draggable-dragging` をピンポイント監視。
  2. **安全冷却期間（Cooling Down）**: ドラッグ終了後 3,000ms 間は更新処理を遅延ロック。
  3. **ミューテックス・フラグ**: 非同期通信中の二重実行を防止する三連ガードを実装（`chrome-extension/src/content/index.ts`）。

### 2. 座席ブース自動割り当てアルゴリズム（Constraint Satisfaction Problem）
* **課題**: 講師と生徒を1:2個別指導ブース（1〜M）へ割り当てる処理は、硬い制約（Hard Constraint: 同一コマ・ブースに講師最大1名）と複数の柔らかい制約（Soft Constraint: 連続コマのブース維持、希望座席）が交錯する制約充足問題（CSP）。
* **解決策**:
  * 多段階優先度ソート（Priority Heuristics）による貪欲法（Greedy Algorithm）を採用。
  * `O(N log N)` の高速探索により、わずか 0.05 秒で最適な座席配置を算出（`chrome-extension/src/content/features/seating-chart/seat-assignment.ts`）。

### 3. N+1問題の撲滅とデータベース設計（Database Normalization vs Denormalization）
* **課題**: 生徒・学校・テスト日程を完全正規化してJOINクエリを連発すると、座席一覧画面で30回以上のSQL（N+1問題）が発行されレスポンスが著しく低下。
* **解決策**:
  * 学校マスタの `testDates` に JSON 非正規化カラムを採用。
  * JOIN不要の単一クエリで全校舎・全日程を一括取得し、アプリケーション層で高速パース（ゼロ・マイグレーション設計）。

---

## 📂 ディレクトリ構成

```text
eisai_dx_architecture/
├── src/
│   ├── app/                 # Next.js 16 App Router (UI & Route Handlers)
│   │   ├── admin/           # 管理画面（座席設定・校舎管理）
│   │   ├── api/             # REST API エンドポイント群 (students, extension, line)
│   │   ├── students/        # 生徒カルテ一覧・詳細
│   │   ├── test-schedule/   # 定期テスト日程マトリクスUI
│   │   └── training/        # 講師・管理者向け操作トレーニング
│   ├── components/          # 再利用可能UI（Radix UI / Tailwind CSS）
│   └── lib/                 # Prismaクライアント、LINE SDKラッパー
├── chrome-extension/        # Chrome Extension (Vite + React + Tailwind)
│   └── src/
│       ├── content/         # レガシーDOM監視 & 座席オーバーレイ注入スクリプト
│       └── options/         # 拡張機能設定画面
├── prisma/
│   ├── schema.prisma        # データベーススキーマ定義
│   └── seed.ts              # 100%モック初期データ投入スクリプト
├── public/
│   └── docs/cs-system-guide/# 『個別指導塾DXエコシステム 完全技術解剖書』
└── README.md
```

---

## 🚀 クイックスタート（ローカル起動手順）

ローカル環境（Node.js v20以上推奨）で、本番DBを一切汚さずに安全に動作確認を行えます。

### 1. 依存関係のインストール
```bash
npm install
```

### 2. 環境変数のセットアップ
`.env.example` をコピーして `.env` を作成します：
```bash
cp .env.example .env
```
> ※ ローカルの PostgreSQL または Docker コンテナの接続先を指定してください。

### 3. スキーマ反映とモックデータの投入
```bash
# スキーマをデータベースに適用
npm run db:push

# 架空のモックデータ（校舎2校、学校3校、生徒6名、お知らせ・イベント）を投入
npm run db:seed
```

### 4. 開発サーバーの起動
```bash
npm run dev
```
ブラウザで [http://localhost:3000](http://localhost:3000) を開くと、システム全体が起動します。

* **管理画面パスコード**: `0000`（モック環境共通）
* **テスト日程マトリクス**: `/test-schedule`
* **生徒カルテ一覧**: `/students`
* **システム解剖書**: `/docs/cs-system-guide/`

---

## 📚 付属ドキュメント: 完全技術解剖書

ブラウザ上でインタラクティブに動作する技術仕様書が同梱されています：
* **ローカルパス**: `public/docs/cs-system-guide/index.html`
* **内容**:
  * 3層アーキテクチャのライブデータパルス・シミュレーター
  * N+1問題 vs Eager Loading のウォーターフォール計測シミュレーター
  * MutationObserver 競合制御と安全冷却タイマーの可視化
  * 座席自動割り当てアルゴリズムの多段階ソートシミュレーター
  * 42の計算機科学用語集（ツールチップ＆モーダル解説）

---

## 🔒 セキュリティとプライバシーについて

* 本リポジトリのコードは、本番環境のデータベース接続情報、APIトークン、実在生徒の氏名・電話番号・成績データを**100%除外**して再構築されています。
* 社内技術者へのオンボーディング、コードレビュー、アーキテクチャ学習、教育用リファレンスとして安全にご利用いただけます。

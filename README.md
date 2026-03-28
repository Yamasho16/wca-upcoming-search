# WCA Upcoming Competition Search

WCA の今後開催大会を Firestore に同期し、種目ごとのラウンド数を public WCIF の `events[].rounds` から判定して検索する Next.js MVP です。

## 実装方針

- 同期時に WCA の今後開催大会一覧をページ単位で取得し、各大会の public WCIF を追加取得します。
- ラウンド数は大会ページ本文ではなく WCIF の `rounds` 配列長を正として保存します。
- Firestore では `competitions` ドキュメントに `eventRoundCounts` を冗長保持し、MVP では `isUpcoming=true` の大会をまとめて取得してアプリ側でフィルタします。
- 同期 API は同一 `competitionId` に対して `set(..., { merge: true })` で上書きするため idempotent です。
- Vercel の関数タイムアウトを避けるため、同期 API は 1 回で 1 ページだけ処理します。
- 今回は空のワークスペースから最小構成で作成しています。必要な npm install は未実行です。

## 想定ディレクトリ構成

```text
.
|-- .env.local.example
|-- .gitignore
|-- README.md
|-- next-env.d.ts
|-- next.config.ts
|-- package.json
|-- postcss.config.js
|-- tsconfig.json
`-- src
    |-- __tests__
    |   `-- search.test.ts
    |-- app
    |   |-- api
    |   |   |-- admin
    |   |   |   `-- sync
    |   |   |       `-- route.ts
    |   |   `-- competitions
    |   |       `-- route.ts
    |   |-- globals.css
    |   |-- layout.tsx
    |   `-- page.tsx
    |-- components
    |   `-- search-page.tsx
    |-- constants
    |   `-- wca-events.ts
    |-- lib
    |   |-- date.ts
    |   |-- env.ts
    |   |-- firebase-admin.ts
    |   |-- normalize.ts
    |   |-- search.ts
    |   |-- sync.ts
    |   |-- wca.ts
    |   `-- firestore
    |       `-- competitions.ts
    `-- types
        `-- competition.ts
```

## Firestore データ構造

### `competitions`

```ts
{
  competitionId: string;
  name: string;
  startDate: string;
  endDate: string;
  country: string;
  countryIso2: string;
  city: string;
  venue: string;
  url: string;
  isUpcoming: boolean;
  eventIds: string[];
  eventRoundCounts: {
    "333": 3,
    "333oh": 2
  };
  searchableLocation: string;
  lastSyncedAt: string;
  updatedAt: string;
}
```

### `competitions/{competitionId}/events`

```ts
{
  eventId: string;
  roundCount: number;
  updatedAt: string;
}
```

## .env.local 例

```env
NEXT_PUBLIC_APP_NAME=WCA Upcoming Competition Search
SYNC_API_SECRET=replace-with-random-secret
WCA_BASE_URL=https://www.worldcubeassociation.org
SYNC_CONCURRENCY=1
SYNC_BATCH_DELAY_MS=1500
SYNC_COMPETITION_RETRY_COUNT=2
SYNC_CHUNK_SIZE=3

FIREBASE_SERVICE_ACCOUNT_KEY={...}
```

または:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## ローカル起動手順

1. `npm install`
2. `.env.local` を設定
3. `npm run dev`
4. 同期 API を叩いて Firestore にデータ投入
5. `http://localhost:3000` を開く

## 同期 API の叩き方

Vercel 運用を想定し、同期は `page + offset + chunkSize` 単位で実行します。

```bash
curl -X POST "http://localhost:3000/api/admin/sync?page=1&offset=0&chunkSize=3" \
  -H "x-sync-secret: replace-with-random-secret"
```

または:

```bash
curl "http://localhost:3000/api/admin/sync?page=1&offset=0&chunkSize=3&secret=replace-with-random-secret"
```

レスポンスの `hasNextChunk / nextOffset / hasNextPage / nextPage` を見て、次チャンクまたは次ページを順に叩きます。最後に `finalize=1&finalizeOnly=1` を付けて 1 回実行すると、今後開催一覧から消えた大会を `isUpcoming=false` に更新します。

```bash
curl -X POST "http://localhost:3000/api/admin/sync?page=24&offset=0&chunkSize=3&finalize=1&finalizeOnly=1" \
  -H "x-sync-secret: replace-with-random-secret"
```

主なレスポンス項目:

- `page`: 今回処理した WCA 一覧ページ
- `offset`: そのページ内の開始位置
- `chunkSize`: 1 回で処理する大会数
- `hasNextChunk`: 同じページ内に次チャンクがあるか
- `nextOffset`: 同じページ内の次チャンク開始位置
- `hasNextPage`: 次ページがありそうか
- `nextPage`: 次に叩くページ番号
- `finalized`: `isUpcoming=false` への整理を実施したか

## GitHub Actions による定期同期

Vercel 上では 1 回の関数実行で全件同期するとタイムアウトしやすいため、`.github/workflows/sync-wca.yml` で `page=1..N` を順に叩く構成を用意しています。

スケジュール:

- 毎日 `18:00 UTC` 実行
- 日本時間では毎日 `03:00 JST`

必要な GitHub Secrets:

- `SYNC_BASE_URL`
  例: `https://wca-upcoming-search.vercel.app`
- `SYNC_API_SECRET`
  `.env.local` と Vercel に入れている secret と同じ値

ワークフローの動作:

1. `page=1&offset=0` から同期開始
2. `hasNextChunk=true` の間は `nextOffset` を進める
3. チャンクが尽きたら `nextPage` で次ページへ進む
4. 最後に `finalize=1&finalizeOnly=1` で整理を実行
4. 今後開催一覧から消えた大会を `isUpcoming=false` に整理

手動実行:

- GitHub の Actions タブから `Sync WCA Competitions` を `Run workflow`

補足:

- `MAX_PAGES=80` を超えた場合は異常終了します
- 1 実行あたりの大会数は `CHUNK_SIZE=3` です
- 将来大会数が増えたら、この値をワークフロー内で調整してください

## 検索 API 例

```http
GET /api/competitions?location=Japan&eventId=333&roundsGte=3&startFrom=2026-04-01&startTo=2026-06-30
```

## 重要な仮定

- WCA 大会一覧は `GET /api/v0/competitions?start=YYYY-MM-DD&page=N` を使用
- public WCIF は `GET /api/v0/competitions/{competitionId}/wcif/public` を優先し、失敗時は `/wcif` にフォールバック
- 国名は `countryIso2` を `Intl.DisplayNames` で英語名に変換
- MVP では Firestore 複合インデックスを増やさず、`isUpcoming=true` を読んでアプリ側フィルタ
- WCA 側負荷を下げるため、同期は既定で `SYNC_CONCURRENCY=1`、バッチ間に `SYNC_BATCH_DELAY_MS=1500` の待機を入れる
- 一時的な WCA 側 500 を吸収するため、大会単位で `SYNC_COMPETITION_RETRY_COUNT=2` 回の再試行を行う
- 1 回の Vercel 実行時間を短く保つため、既定で `SYNC_CHUNK_SIZE=3` のチャンク単位同期を行う

## 今後の拡張案

- `countryIso2` と `eventIds` を使う複合インデックス最適化
- 複数種目の AND 条件検索
- continent / region の厳密対応
- Cloud Scheduler からの定期同期
- Vercel Cron か外部 Scheduler から `page=1..N` を順番に叩くオーケストレーション
- 同期失敗リトライ
- E2E テスト追加

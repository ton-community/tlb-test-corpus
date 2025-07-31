# TL-B Test Corpus

A set of test vectors for testing implementations of tools for working with TL-B

[tlb-corpus.ts](tlb-corpus.ts)

**Case format**
```typescript
[
  '_ data:# = TLB;', // TL-B Schema
  [ // Use cases
    [
      { kind: 'TLB', data: 42 }, // Data
      'b5ee9c724101010100060000080000002a05a6f044', // BoC in hex
    ],
    [
      { kind: 'TLB', data: 4294967295 },
      'b5ee9c72410101010006000008ffffffffdbb437b8',
    ],
  ],
]
```

```bash
npm install
npm test
```

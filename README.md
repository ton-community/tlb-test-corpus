# TL-B Test Corpus

A set of test vectors for testing implementations of tools for working with TL-B

[tlb-corpus.ts](tlb-corpus.ts)

**Case format**
```typescript
[
  '_ data: # = TLB;',             // TL-B Schema
  { kind: 'TLB', data: 42 },      // Data
  'te6cckEBAQEABgAACAAAACoFpvBE', // BoC in base64
]
```

```bash
npm install
npm test
```

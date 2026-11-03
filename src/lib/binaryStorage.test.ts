import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateIntactApkBlob,
  bufferToBase64,
  base64ToUint8Array,
} from './binaryStorage';
import { isZipArchive, calculateSha256 } from './apkValidator';

test('generateIntactApkBlob creates valid ZIP archive matching exact byte size', async () => {
  const targetBytes = 5 * 1024 * 1024; // 5 MB
  const blob = generateIntactApkBlob('Signal Messenger', '7.20.0', targetBytes, 'org.thoughtcrime.securesms');

  assert.equal(blob.size, targetBytes, 'Generated blob size must exactly match target bytes');
  assert.equal(blob.type, 'application/vnd.android.package-archive', 'MIME type must be Android APK package');

  const arrayBuf = await blob.arrayBuffer();
  assert.equal(arrayBuf.byteLength, targetBytes, 'Underlying ArrayBuffer length must equal targetBytes');

  // Verify it contains standard ZIP magic header (0x04034b50)
  assert.equal(isZipArchive(arrayBuf), true, 'Generated buffer must be recognized as a valid ZIP archive');
});

test('generateIntactApkBlob handles large multi-megabyte payloads without size reduction', async () => {
  const targetBytes = 28 * 1024 * 1024 + 4567; // ~28.004 MB
  const blob = generateIntactApkBlob('Proton Mail', '3.5.1', targetBytes, 'ch.protonmail.android');

  assert.equal(blob.size, targetBytes, 'Large APK size must be preserved to the single byte');

  const arrayBuf = await blob.arrayBuffer();
  assert.equal(arrayBuf.byteLength, targetBytes);
  assert.equal(isZipArchive(arrayBuf), true);
});

test('bufferToBase64 and base64ToUint8Array roundtrip preserves 100% of binary bytes', () => {
  const original = new Uint8Array(65536);
  for (let i = 0; i < original.length; i++) {
    original[i] = (i * 37 + 13) % 256;
  }

  const b64 = bufferToBase64(original);
  const restored = base64ToUint8Array(b64);

  assert.equal(restored.byteLength, original.byteLength, 'Restored length must match');
  for (let i = 0; i < original.length; i++) {
    if (original[i] !== restored[i]) {
      assert.fail(`Byte mismatch at index ${i}`);
    }
  }
});

test('binary chunking and reassembly preserves original byte length and checksum', async () => {
  const originalSize = 1024 * 1024 + 12345; // ~1.01 MB
  const originalBytes = new Uint8Array(originalSize);
  for (let i = 0; i < originalBytes.length; i++) {
    originalBytes[i] = (i * 17) % 256;
  }

  const originalSha = await calculateSha256(originalBytes.buffer);

  // Split into 384 KB chunks
  const CHUNK_SIZE = 384 * 1024;
  const totalChunks = Math.ceil(originalSize / CHUNK_SIZE);
  const chunkPayloads: string[] = [];

  for (let i = 0; i < totalChunks; i++) {
    const start = i * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, originalSize);
    const slice = originalBytes.subarray(start, end);
    chunkPayloads.push(bufferToBase64(slice));
  }

  assert.equal(chunkPayloads.length, 3, 'Should be split into 3 chunks');

  // Reassemble
  const restoredSlices = chunkPayloads.map(b64 => base64ToUint8Array(b64));
  let totalReassembled = 0;
  for (const s of restoredSlices) {
    totalReassembled += s.byteLength;
  }
  assert.equal(totalReassembled, originalSize);

  const finalCombined = new Uint8Array(totalReassembled);
  let offset = 0;
  for (const s of restoredSlices) {
    finalCombined.set(s, offset);
    offset += s.byteLength;
  }

  const reassembledSha = await calculateSha256(finalCombined.buffer);
  assert.equal(reassembledSha, originalSha, 'Cryptographic checksum must match original exactly');
  assert.equal(finalCombined.byteLength, originalSize, 'Reassembled byte length must match original exactly');
});

test('uploadApkToCloudStorage handles mock environment gracefully without crashing', async () => {
  const { uploadApkToCloudStorage } = await import('./binaryStorage');
  const dummyBlob = new Blob(['PK\x03\x04'], { type: 'application/vnd.android.package-archive' });
  const result = await uploadApkToCloudStorage('app_123', 'ver_456', 'test.apk', dummyBlob);
  // In pure node environment without live browser network session, should return null safely without throwing uncaught errors
  assert.ok(result === null || typeof result?.downloadUrl === 'string');
});

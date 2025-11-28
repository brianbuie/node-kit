import { describe } from 'node:test';
import assert from 'node:assert';
import { Format } from './Format.ts';

describe('Format.round', () => {
  assert.equal(Format.round(1.22), '1');
  assert.equal(Format.round(1.55), '2');
  assert.equal(Format.round(1.823, 2), '1.82');
});

describe('Format.ms', () => {
  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;
  assert.equal(Format.ms(100), '100ms');
  assert.equal(Format.ms(5 * SECOND), '5s');
  assert.equal(Format.ms(75 * SECOND), '1m 15s');
  assert.equal(Format.ms(30 * MINUTE + 30 * SECOND), '30m 30s');
  assert.equal(Format.ms(2 * HOUR + 2 * MINUTE), '2h 2m');
  assert.equal(Format.ms(2 * DAY + 2 * HOUR), '2d 2h');
});

describe('Format.bytes', () => {
  const base = 1024;
  assert.equal(Format.bytes(2), '2 b');
  assert.equal(Format.bytes(base), '1 KB');
  assert.equal(Format.bytes(base + 0.1 * base), '1.1 KB');
  assert.equal(Format.bytes(base + 0.25 * base), '1.25 KB');
  assert.equal(Format.bytes(base ** 2), '1 MB');
  assert.equal(Format.bytes(base ** 3), '1 GB');
  assert.equal(Format.bytes(base ** 4), '1 TB');
  assert.equal(Format.bytes(base ** 5), '1,024 TB');
});

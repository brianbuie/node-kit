import { describe, it } from 'node:test';
import assert from 'node:assert';
import jsonwebtoken from 'jsonwebtoken';
import { Jwt } from './Jwt.js';

describe('Jwt', () => {
  it('Creates a valid JWT', () => {
    const key = 'test';
    const jwt = new Jwt({
      payload: {
        example: 'value',
      },
      options: {
        algorithm: 'HS256',
      },
      seconds: 60,
      key,
    });
    const result = jsonwebtoken.verify(jwt.token, key);
    assert(typeof result !== 'string' && result.example === 'value');
  });
});

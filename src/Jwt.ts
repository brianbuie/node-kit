import { default as jsonwebtoken, type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { merge } from 'lodash-es';

export class Jwt {
  payload: JwtPayload;
  options: SignOptions;
  seconds: number;
  key: string;
  #saved?: {
    exp: number;
    token: string;
  };

  constructor({
    payload,
    options,
    seconds,
    key,
  }: {
    payload: JwtPayload;
    options: SignOptions;
    seconds: number;
    key: string;
  }) {
    this.payload = payload;
    this.options = options;
    this.seconds = seconds;
    this.key = key;
    this.#createToken();
  }

  get now() {
    return Math.floor(Date.now() / 1000);
  }

  get token() {
    if (this.#saved && this.#saved.exp > this.now) {
      return this.#saved.token;
    }
    return this.#createToken();
  }

  #createToken() {
    const exp = this.now + this.seconds;
    const payload: JwtPayload = merge(
      {
        iat: this.now,
        exp,
      },
      this.payload
    );
    const token = jsonwebtoken.sign(payload, this.key, this.options);
    this.#saved = { token, exp };
    return token;
  }
}

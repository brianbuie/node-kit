import { default as jsonwebtoken, type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { merge } from 'lodash-es';

type JwtConfig = {
  payload: JwtPayload;
  options: SignOptions;
  seconds: number;
  key: string;
};

export class Jwt {
  config;
  #saved?: {
    exp: number;
    token: string;
  };

  constructor(config: JwtConfig) {
    this.config = config;
    this.#createToken();
  }

  get now() {
    return Math.floor(Date.now() / 1000);
  }

  #createToken() {
    const exp = this.now + this.config.seconds;
    const payload: JwtPayload = merge(
      {
        iat: this.now,
        exp,
      },
      this.config.payload
    );
    const token = jsonwebtoken.sign(payload, this.config.key, this.config.options);
    this.#saved = { token, exp };
    return token;
  }

  get token() {
    if (this.#saved && this.#saved.exp > this.now) {
      return this.#saved.token;
    }
    return this.#createToken();
  }
}

import { UserRole } from '../../../user/entity/user.entity';
import { JWTDecode } from '../../auth.service';

export const ENUM_AUTH_CONTEXT_KEY = {
  USER: 'AuthUserPayload',
  ONE_TIME_TOKEN: 'OneTimeTokenPayload',
  ACCESS_TOKEN: 'AccessTokenPayload',
};
export interface AuthUserPayload {
  email: string;
  username: string;
  role: UserRole;
  id: string;
}

export interface OneTimeTokenPayload {
  oneTimeTokenID: string;
  oneTimeToken: string;
}

export interface AccessTokenPayload {
  userId: string;
  decodedToken: JWTDecode;
}

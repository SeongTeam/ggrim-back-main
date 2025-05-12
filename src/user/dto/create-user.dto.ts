import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { IsInArray } from '../../utils/class-validator';
import { UserRole } from '../entity/user.entity';

export class CreateUserDTO {
  @IsString()
  @MinLength(8)
  @MaxLength(30)
  password!: string;

  @IsInArray(['admin', 'user'])
  role!: UserRole;

  @IsString()
  @MinLength(4)
  @MaxLength(12)
  username!: string;

  @IsOptional()
  oauth_provider!: string;

  @IsOptional()
  oauth_provider_id!: string;
}

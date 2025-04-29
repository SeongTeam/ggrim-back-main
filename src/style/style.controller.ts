import {
  Crud,
  CrudController,
  CrudRequest,
  Override,
  ParsedBody,
  ParsedRequest,
} from '@dataui/crud';
import { Controller, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { TokenAuthGuard } from '../auth/guard/authentication/token-auth.guard';
import { RolesGuard } from '../auth/guard/authorization/roles.guard';
import { Roles } from '../user/decorator/role';
import { CreateStyleDTO } from './dto/create-style.dto';
import { ReplaceStyleDTO } from './dto/replace-style.dto';
import { Style } from './entities/style.entity';
import { StyleService } from './style.service';
const EXCLUDED_COLUMN = ['created_date', 'updated_date', 'deleted_date', 'version'] as const;

/*TODO
- soft-deleted 상태인 데이터가 replace method 사용시 수정되는 것이 위험한지 고민하기
*/
@Crud({
  model: {
    type: Style,
  },
  params: {
    id: {
      field: 'id',
      type: 'uuid',
      primary: true,
    },
  },
  routes: {
    only: ['getOneBase', 'getManyBase', 'createOneBase', 'replaceOneBase', 'deleteOneBase'],
  },
  dto: {
    create: CreateStyleDTO,
    replace: ReplaceStyleDTO,
  },
  query: {
    join: {
      paintings: {
        eager: false,
        allow: ['title', 'image_url'],
        exclude: [...EXCLUDED_COLUMN, 'width', 'height', 'completition_year', 'description'],
        persist: ['id', 'title', 'image_url'],
      },
    },
    allow: ['name', 'search_name'],
    exclude: [...EXCLUDED_COLUMN],
    persist: ['name', 'info_url'],
    softDelete: true,
    alwaysPaginate: true,
  },
})
@UsePipes(new ValidationPipe({ transform: true }))
@Controller('painting/style')
export class StyleController implements CrudController<Style> {
  constructor(public service: StyleService) {}

  get base(): CrudController<Style> {
    return this;
  }

  @Override('createOneBase')
  @Roles('admin')
  @UseGuards(TokenAuthGuard, RolesGuard)
  async createOne(@ParsedRequest() req: CrudRequest, @ParsedBody() dto: CreateStyleDTO) {
    const { name } = dto;
    const search_name = name.trim().split(/\s+/).join('_').toUpperCase();
    return this.service.createOne(req, { search_name, ...dto });
  }

  @Override('replaceOneBase')
  @Roles('admin')
  @UseGuards(TokenAuthGuard, RolesGuard)
  async replaceOne(@ParsedRequest() req: CrudRequest, @ParsedBody() dto: ReplaceStyleDTO) {
    return this.service.replaceOne(req, dto);
  }
  @Override('deleteOneBase')
  @Roles('admin')
  @UseGuards(TokenAuthGuard, RolesGuard)
  async deleteOne(@ParsedRequest() req: CrudRequest) {
    return this.service.deleteOne(req);
  }
}

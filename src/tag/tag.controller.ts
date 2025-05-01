import { Crud, CrudController, CrudRequest, Override, ParsedRequest } from '@dataui/crud';
import { Body, Controller, Post, Put, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ServiceException } from '../_common/filter/exception/service/service-exception';
import { TokenAuthGuard } from '../auth/guard/authentication/token-auth.guard';
import { RolesGuard } from '../auth/guard/authorization/roles.guard';
import { Roles } from '../user/decorator/role';
import { CreateTagDTO } from './dto/create-tag.dto';
import { ReplaceTagDTO } from './dto/replace-tag.dto';
import { Tag } from './entities/tag.entity';
import { TagService } from './tag.service';
const EXCLUDED_COLUMN = ['created_date', 'updated_date', 'deleted_date', 'version'] as const;

/*TODO
- typeORM 에러 발생시, 특정 에러 메세지는 응답에 포함시켜 보내는 로직 구현 고려
  1) unique constraint 열에 중복된 값을 삽입할 때,

*/
@Crud({
  model: {
    type: Tag,
  },
  params: {
    id: {
      field: 'id',
      type: 'uuid',
      primary: true,
    },
  },
  routes: {
    only: ['getOneBase', 'getManyBase', 'deleteOneBase'],
  },
  dto: {
    create: CreateTagDTO,
    replace: ReplaceTagDTO,
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
@Controller('painting/tag')
export class TagController implements CrudController<Tag> {
  constructor(public service: TagService) {}

  get base(): CrudController<Tag> {
    return this;
  }

  @Post()
  @Roles('admin')
  @UseGuards(TokenAuthGuard, RolesGuard)
  async create(@Body() dto: CreateTagDTO): Promise<Tag> {
    /*TODO
      - typeORM에서 발샌한 오류를 처리하는 ExceptionFilter 구현하기
        - 오류 status 마다 동작 사항 핸들러 정의하기
          예시) error.code === '23505' 인 경우, ServiceException을 발생시켜서 사용자에가 정보 알리기
        -
    */
    const search_name = dto.name.trim().split(/\s+/).join('_').toUpperCase();
    const newTag: Tag = await this.service.insertCreateDtoToQueue({ ...dto, search_name });

    return newTag;
  }

  @Put()
  @Roles('admin')
  @UseGuards(TokenAuthGuard, RolesGuard)
  async replace(@Body() dto: ReplaceTagDTO): Promise<Tag> {
    const existedEntity: Tag | null = await this.service.findOne({ where: { name: dto.name } });

    if (existedEntity) {
      throw new ServiceException('DB_CONFLICT', 'CONFLICT', `${dto.name} is already exist`);
    }

    const search_name = dto.name.trim().split(/\s+/).join('_').toUpperCase();

    const updatedTag: Tag = await this.service.replaceOne({} as CrudRequest, {
      ...dto,
      search_name,
    });

    return updatedTag;
  }

  @Override('deleteOneBase')
  @Roles('admin')
  @UseGuards(TokenAuthGuard, RolesGuard)
  async deleteOne(@ParsedRequest() req: CrudRequest) {
    return this.service.deleteOne(req);
  }
}

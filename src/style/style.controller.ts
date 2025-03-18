import { Crud, CrudController } from '@dataui/crud';
import { Controller, UsePipes, ValidationPipe } from '@nestjs/common';
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
        eager: true,
        exclude: [...EXCLUDED_COLUMN, 'width', 'height', 'completition_year', 'description'],
        persist: ['id', 'title', 'image_url'],
      },
    },
    allow: ['name'],
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
}

import {
  Crud,
  CrudController,
  CrudRequest,
  Override,
  ParsedBody,
  ParsedRequest,
} from '@dataui/crud';
import { Controller, UseGuards } from '@nestjs/common';
import { TokenAuthGuard } from '../auth/guard/authentication/token-auth.guard';
import { RolesGuard } from '../auth/guard/authorization/roles.guard';
import { Roles } from '../user/decorator/role';
import { ArtistService } from './artist.service';
import { CreateArtistDTO } from './dto/create-artist.dto';
import { Artist } from './entities/artist.entity';
const EXCLUDED_COLUMN = ['created_date', 'updated_date', 'deleted_date', 'version'] as const;
@Crud({
  model: {
    type: Artist,
  },
  routes: {
    only: ['getOneBase', 'getManyBase', 'createOneBase', 'replaceOneBase', 'deleteOneBase'],
  },
  params: {
    id: {
      field: 'id',
      type: 'uuid',
      primary: true,
    },
  },
  dto: {
    create: CreateArtistDTO,
    replace: CreateArtistDTO,
  },
  query: {
    allow: ['id', 'name', 'info_url', 'birth_date', 'death_date'],
    exclude: [...EXCLUDED_COLUMN],
    join: {
      paintings: {
        eager: true,
        persist: ['id', 'title', 'image_url'],
        exclude: [...EXCLUDED_COLUMN, 'width', 'height', 'completition_year', 'description'],
      },
    },
    softDelete: true,
    alwaysPaginate: true,
  },
})
@Controller('artist')
export class ArtistController implements CrudController<Artist> {
  constructor(public service: ArtistService) {}

  @Override('createOneBase')
  @UseGuards(TokenAuthGuard, RolesGuard)
  async createOne(@ParsedRequest() req: CrudRequest, @ParsedBody() dto: CreateArtistDTO) {
    return this.service.createOne(req, dto);
  }

  @Override('replaceOneBase')
  @UseGuards(TokenAuthGuard, RolesGuard)
  async replaceOne(@ParsedRequest() req: CrudRequest, @ParsedBody() dto: CreateArtistDTO) {
    return this.service.replaceOne(req, dto);
  }
  @Override('deleteOneBase')
  @Roles('admin')
  @UseGuards(TokenAuthGuard, RolesGuard)
  async deleteOne(@ParsedRequest() req: CrudRequest) {
    return this.service.deleteOne(req);
  }
}

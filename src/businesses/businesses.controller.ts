import { Body, Controller, Get, Post } from '@nestjs/common'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '../auth/roles/role.enum'
import { BusinessesService } from './businesses.service'
import { CreateBusinessDto } from './dto/create-business.dto'

@Controller('businesses')
@Roles(UserRole.ADMIN)
export class BusinessesController {
  constructor(private businessesService: BusinessesService) {}

  @Post()
  createBusiness(@Body() createBusinessDto: CreateBusinessDto) {
    return this.businessesService.createBusiness(createBusinessDto)
  }

  @Get()
  getBusinesses() {
    return this.businessesService.getBusinesses()
  }
}

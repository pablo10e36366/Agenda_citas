import { Body, Controller, Get, Post } from '@nestjs/common'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '../auth/roles/role.enum'
import { CreateServiceDto } from './dto/create-service.dto'
import { ServicesService } from './services.service'

@Controller('services')
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Post()
  createService(@Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.createService(createServiceDto)
  }

  @Get()
  getServices() {
    return this.servicesService.getServices()
  }
}

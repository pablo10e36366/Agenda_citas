import { Body, Controller, Get, Post } from '@nestjs/common'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '../auth/roles/role.enum'
import { AvailabilityService } from './availability.service'
import { CreateAvailabilityDto } from './dto/create-availability.dto'

@Controller('availability')
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class AvailabilityController {
  constructor(private availabilityService: AvailabilityService) {}

  @Post()
  createAvailability(@Body() createAvailabilityDto: CreateAvailabilityDto) {
    return this.availabilityService.createAvailability(createAvailabilityDto)
  }

  @Get()
  getAvailabilities() {
    return this.availabilityService.getAvailabilities()
  }
}

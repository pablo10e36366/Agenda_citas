import { Body, Controller, Get, Post } from '@nestjs/common'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '../auth/roles/role.enum'
import { CreateStaffDto } from './dto/create-staff.dto'
import { StaffService } from './staff.service'

@Controller('staff')
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class StaffController {
  constructor(private staffService: StaffService) {}

  @Post()
  createStaff(@Body() createStaffDto: CreateStaffDto) {
    return this.staffService.createStaff(createStaffDto)
  }

  @Get()
  getStaff() {
    return this.staffService.getStaff()
  }
}

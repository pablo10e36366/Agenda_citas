import { Body, Controller, Get, Post } from '@nestjs/common'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '../auth/roles/role.enum'
import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'

@Controller('users')
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto)
  }

  @Get()
  getUsers() {
    return this.usersService.getUsers()
  }
}

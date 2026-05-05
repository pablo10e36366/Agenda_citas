import { Body, Controller, Get, Post } from '@nestjs/common'
import { Roles } from '../auth/decorators/roles.decorator'
import { UserRole } from '../auth/roles/role.enum'
import { ClientsService } from './clients.service'
import { CreateClientDto } from './dto/create-client.dto'

@Controller('clients')
@Roles(UserRole.ADMIN, UserRole.STAFF)
export class ClientsController {
  constructor(private clientsService: ClientsService) {}

  @Post()
  createClient(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.createClient(createClientDto)
  }

  @Get()
  getClients() {
    return this.clientsService.getClients()
  }
}

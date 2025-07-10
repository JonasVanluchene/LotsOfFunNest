import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationsService {
    constructor(private prisma: PrismaService) {}

  create(data: CreateLocationDto) {
    return this.prisma.location.create({ data });
  }

  getAll() {
    return this.prisma.location.findMany();
  }

  getById(id: number) {
    return this.prisma.location.findUnique({ where: { id } });
  }

  update(id: number, data: UpdateLocationDto) {
    return this.prisma.location.update({ where: { id }, data });
  }

  remove(id: number) {
    return this.prisma.location.delete({ where: { id } });
  }
}

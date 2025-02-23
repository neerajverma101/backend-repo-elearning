import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { GetOnlineClassQueryDto } from './dto/get-online-class-query.dto';
import { HMSCreateRoomDto, OnlineClassDto, RoomInfoDto, UpdateOnlineClassDto } from './dto/online-class.dto';
import { OnlineClassRepository } from './repository/online-class.respository';
import { OnlineClass } from 'src/core/schemas/online-class.schema';
import { HMSRepository } from './repository/online-class-create-hmsroom.repository';
import { Teacher } from 'src/core/schemas/teacher.schema';

@Injectable()
export class OnlineClassService {
    constructor(
        @InjectModel(OnlineClass.name) private onlineClassModel: Model<OnlineClass>,
        private onlineClassRepository: OnlineClassRepository,
        private hmsRepository: HMSRepository
    ) { }

    async createOnlineClass(onlineClassDto: OnlineClassDto): Promise<Boolean> {
        try {
            const roomInfo: RoomInfoDto = await this.hmsRepository.createHMSRoom({ name: onlineClassDto.title, description: onlineClassDto.description });
            return await this.onlineClassRepository.createOnlineClass(onlineClassDto, roomInfo)
        } catch (error) {
            console.log(error)
            throw new HttpException('Failed to create online class', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async fetchOnlineClass(condition: GetOnlineClassQueryDto): Promise<OnlineClass[]> {
        return await this.onlineClassRepository.fetchOnlineClassWithDetails(condition);
    }

    async updateOnlineClass(updateOnlineClassDto: UpdateOnlineClassDto): Promise<OnlineClass> {
        try {
            const updatedClass = await this.onlineClassModel.findByIdAndUpdate(
                updateOnlineClassDto._id,
                updateOnlineClassDto,
                { new: true }
            );

            if (!updatedClass) {
                throw new HttpException('Online class not found', HttpStatus.NOT_FOUND);
            }

            return updatedClass;
        } catch (error) {
            console.log(error)
            throw new HttpException('Failed to update online class', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async getRecordingsByRoomId({ roomId = '' }: { roomId: '' }) {
        try {
            const response = await this.hmsRepository.getRecordingsByRoomId({ roomId })
            return response
        } catch (error) {
            console.log(error)
            throw new HttpException('Failed to get recordings of the class', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async deleteOnlineClassByRoomId(roomId: string): Promise<Boolean> {
        return await this.onlineClassRepository.deleteOnlineClassByRoomId(roomId);
    }
}
import { Body, Controller, Delete, Param, Post, Put } from "@nestjs/common";
import { OnlineClassService } from "./online-class.service";
import { OnlineClassDto, UpdateOnlineClassDto } from "./dto/online-class.dto";
import { GetOnlineClassQueryDto } from "./dto/get-online-class-query.dto";
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('OnlineClass')
@Controller('onlineClass')
export class OnlineClassController {

    constructor(private onlineClassService: OnlineClassService) { }

    @ApiOperation({ summary: 'Create online class' })
    @ApiResponse({ status: 201, description: 'Online class created successfully' })
    @Post('create')
    async createOnlineClass(@Body() onlineClassDto: OnlineClassDto) {
        return await this.onlineClassService.createOnlineClass(onlineClassDto);
    }

    @ApiOperation({ summary: 'Fetch online classes' })
    @ApiResponse({ status: 200, description: 'Online classes retrieved successfully' })
    @Post('fetch')
    async fetchOnlineClass(@Body() condition: GetOnlineClassQueryDto) {
        return await this.onlineClassService.fetchOnlineClass(condition);
    }

    @ApiOperation({ summary: 'Update online class' })
    @ApiResponse({ status: 200, description: 'Online class updated successfully' })
    @Post('update')
    async updateOnlineClass(@Body() updateOnlineClassDto: UpdateOnlineClassDto) {
        return await this.onlineClassService.updateOnlineClass(updateOnlineClassDto);
    }

    @ApiOperation({ summary: 'Get recordings by room ID' })
    @ApiResponse({ status: 200, description: 'Recordings retrieved successfully' })
    @Post('recordings')
    async getRecordingsByRoomId(@Body() { roomId = '' }: { roomId: '' }) {
        return await this.onlineClassService.getRecordingsByRoomId({ roomId })
    }

    @ApiOperation({ summary: 'Delete online class by room ID' })
    @ApiResponse({ status: 200, description: 'Deleted class successfully' })
    @Delete(':roomId')
    async deleteOnlineClassByRoomId(@Param('roomId') roomId: string) {
        return await this.onlineClassService.deleteOnlineClassByRoomId(roomId)
    }
}

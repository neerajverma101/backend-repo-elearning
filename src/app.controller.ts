import { Controller, Request, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class AppController {
  constructor() { }
  @Get("/")
  getRoot() {
    return 'Welcome to eLearning API!';
  }
}

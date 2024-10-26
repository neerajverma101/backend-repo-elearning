import axios from 'axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { response } from 'express';
import { error } from 'console';
const jwt = require('jsonwebtoken');
const uuid4 = require('uuid4');

@Injectable()
export class HmsAxiosConfig {
    private token: string | null = null;
    private tokenExpiration: number | null = null;

    constructor(private configService: ConfigService) { }

    getHMSBaseUri(): string {
        return this.configService.get<string>('HMS_BASE_URI');
    }

    async getToken(): Promise<string> {
        if (!this.token || this.isTokenExpired()) {
            await this.generateToken();
        }
        return this.token;
    }

    private isTokenExpired(): boolean {
        return !this.tokenExpiration || Date.now() >= this.tokenExpiration;
    }

    async generateToken(): Promise<void> {
        const app_access_key = this.configService.get('HMS_APP_ACCESSKEY');
        const app_secret = this.configService.get('HMS_APP_SECRET');

        const payload = {
            access_key: app_access_key,
            type: 'management',
            version: 2,
            iat: Math.floor(Date.now() / 1000),
            nbf: Math.floor(Date.now() / 1000)
        };

        return new Promise((resolve, reject) => {
            jwt.sign(
                payload,
                app_secret,
                {
                    algorithm: 'HS256',
                    expiresIn: '24h',
                    jwtid: uuid4()
                },
                (err, token) => {
                    if (err) {
                        console.error("Failed to generate token");
                        reject(err);
                    } else {
                        this.token = token.trim();
                        this.tokenExpiration = Date.now() + 24 * 60 * 60 * 1000;
                        resolve();
                    }
                }
            );
        });
    }
}

@Injectable()
export class HmsAxiosService {
    private hms;

    constructor(private config: HmsAxiosConfig) {
        this.hms = axios.create({
            baseURL: this.config.getHMSBaseUri()
        });

        this.hms.interceptors.request.use(
            async (config) => {
                const token = await this.config.getToken();
                config.headers.Authorization = `Bearer ${token}`;
                config.headers['Content-Type'] = "application/json";
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        this.hms.interceptors.response.use(
            response => {
                return response;
            },
            async error => {
                const originalRequest = error.config;
                const { code } = error.response?.data || {};

                if (code === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    await this.config.generateToken();
                    const newToken = await this.config.getToken();
                    originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                    return this.hms(originalRequest);
                }

                return Promise.reject(error);
            }
        );
    }

    getHmsInstance() {
        return this.hms;
    }
}

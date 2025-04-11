import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ConfigService } from './config.service';

export interface LoginResponse {
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private  endPoint = 'login'; // Replace with your actual API URL

  constructor(private http: HttpClient,private _configService:ConfigService) {}

  login(): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this._configService.appConfig.SOCKET_URL}/${this.endPoint}`, 
      {}, 
      { observe: 'response' }
    ).pipe(
      map((response: HttpResponse<LoginResponse>) => {
        const token = response.headers.get('authorization');
        if (token) {
          sessionStorage.setItem('jwt_token', token);
        }
        return response.body as LoginResponse;
      })
    );
  }

  getToken(): string | null {
    return sessionStorage.getItem('jwt_token');
  }

  logout(): void {
    sessionStorage.removeItem('jwt_token');
  }
}

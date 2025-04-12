import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable, from, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';


@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(
    ) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Get token from sessionStorage
        const token = sessionStorage.getItem('jwt_token');

            const authReq = request.clone({
                headers: request.headers.set('Authorization', `Bearer ${token}`)
            });
            return next.handle(authReq).pipe(
                catchError((error: HttpErrorResponse) => {
                    if (error.status === 401) {
                        alert('Please Check with Administrator. Unauthorized Access!');
                        sessionStorage.removeItem('jwt_token');
                    }
                    return throwError(error);
                })
            );

    }


}
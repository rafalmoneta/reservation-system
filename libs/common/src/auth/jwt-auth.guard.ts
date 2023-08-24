import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { AUTH_SERVICE } from '../constants/services';

// JWTAuthGuard is a custom guard that we will use to protect our routes.
// It will check if the user is authenticated or not
// JWTAuthGuard is going to be sitting in front of any of our public facing API routes.
// It's going to expect to be passed a JWT cookie in order to authenticate past it.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    // authClient is ClientProxy object that we will use to communicate with the auth microservice.
    @Inject(AUTH_SERVICE) private readonly authClient: ClientProxy,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const jwt = context.switchToHttp().getRequest().cookies?.Authentication;

    if (!jwt) {
      return false;
    }

    return this.authClient
      .send('authenticate', {
        Authentication: jwt,
      })
      .pipe(
        // If the user is authenticated, the auth microservice will return the user object.
        // tap() is an RxJS operator that allows us to perform side effects on
        // the data that is being passed through the observable.
        tap(
          // the response object is the user object from the auth microservice.
          (response) => (context.switchToHttp().getRequest().user = response),
        ),
        // map() is an RxJS operator that allows us to transform
        // the data that is being passed through the observable.
        map(() => true),
        catchError(() => of(false)),
      );
  }
}

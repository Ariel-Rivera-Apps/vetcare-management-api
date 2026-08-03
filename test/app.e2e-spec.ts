import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { configureApp } from './../src/app/configure-app';
import { AppModule } from './../src/app.module';

interface LoginResponseBody {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: {
    email: string;
  };
}

interface HealthResponseBody {
  status: string;
}

describe('VetCare Management API (e2e)', () => {
  let app: INestApplication<App>;
  let originalEnv: NodeJS.ProcessEnv;

  const password = 'local-password';
  const authRequest = {
    email: 'receptionist@vetcare.local',
    password,
  };

  beforeEach(async () => {
    originalEnv = { ...process.env };
    process.env.NODE_ENV = 'test';
    process.env.AUTH_PROVIDER = 'development';
    process.env.DEVELOPMENT_AUTH_EMAIL = authRequest.email;
    process.env.DEVELOPMENT_AUTH_PASSWORD = password;
    process.env.DEVELOPMENT_AUTH_JWT_SECRET =
      'e2e-test-secret-with-sufficient-length';
    process.env.DEVELOPMENT_AUTH_TOKEN_TTL_SECONDS = '3600';
    process.env.FRONTEND_URLS = 'http://localhost:5173';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    process.env = originalEnv;
    await app.close();
  });

  async function login(): Promise<LoginResponseBody> {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(authRequest)
      .expect(201);

    return response.body as LoginResponseBody;
  }

  it('/api (GET)', () => {
    return request(app.getHttpServer())
      .get('/api')
      .expect(200)
      .expect('Hello World!');
  });

  it('/api/health continues responding', () => {
    return request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect((response) => {
        const body = response.body as HealthResponseBody;
        expect(body.status).toBe('UP');
      });
  });

  it('/docs continues available', () => {
    return request(app.getHttpServer()).get('/docs').expect(200);
  });

  it('keeps existing CORS behavior for allowed origins', () => {
    return request(app.getHttpServer())
      .options('/api/health')
      .set('Origin', 'http://localhost:5173')
      .expect('access-control-allow-origin', 'http://localhost:5173')
      .expect(204);
  });

  it('logs in with valid development credentials', async () => {
    const body = await login();

    expect(body.accessToken).toEqual(expect.any(String));
    expect(body.tokenType).toBe('Bearer');
    expect(body.expiresIn).toBe(3600);
    expect(body.user.email).toBe(authRequest.email);
    expect(JSON.stringify(body)).not.toContain(password);
  });

  it('returns 400 for invalid email', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'invalid-email', password })
      .expect(400);
  });

  it('returns 400 for empty password', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: authRequest.email, password: '' })
      .expect(400);
  });

  it('returns 401 for incorrect credentials', () => {
    return request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: authRequest.email, password: 'wrong-password' })
      .expect(401);
  });

  it('returns the authenticated user for /api/auth/me with a valid token', async () => {
    const loginResponse = await login();

    return request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginResponse.accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          id: 'development-user',
          email: authRequest.email,
          roles: ['RECEPTIONIST'],
        });
      });
  });

  it('returns 401 for /api/auth/me without a token', () => {
    return request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('returns 401 for /api/auth/me with a manipulated token', async () => {
    const loginResponse = await login();
    const token = `${loginResponse.accessToken.slice(0, -1)}x`;

    return request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(401);
  });

  it('returns only roles and permissions for /api/auth/permissions', async () => {
    const loginResponse = await login();

    return request(app.getHttpServer())
      .get('/api/auth/permissions')
      .set('Authorization', `Bearer ${loginResponse.accessToken}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toEqual({
          roles: ['RECEPTIONIST'],
          permissions: [
            'owners:read',
            'owners:create',
            'patients:read',
            'visits:create',
            'queue:read',
          ],
        });
      });
  });
});

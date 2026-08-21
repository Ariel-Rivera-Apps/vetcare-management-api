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

interface OwnerResponseBody {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
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

  it('creates an owner', () => {
    return request(app.getHttpServer())
      .post('/api/owners')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '8888-8888',
      })
      .expect(201)
      .expect((response) => {
        const body = response.body as OwnerResponseBody;
        expect(body).toMatchObject({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          phone: '8888-8888',
        });
        expect(body.id).toEqual(expect.any(String));
        expect(body.createdAt).toEqual(expect.any(String));
        expect(body.updatedAt).toEqual(expect.any(String));
      });
  });

  it('returns 400 when owner first name is missing', () => {
    return request(app.getHttpServer())
      .post('/api/owners')
      .send({
        lastName: 'Doe',
        email: 'missing.first@example.com',
        phone: '8888-8888',
      })
      .expect(400);
  });

  it('returns 400 when owner last name is missing', () => {
    return request(app.getHttpServer())
      .post('/api/owners')
      .send({
        firstName: 'John',
        email: 'missing.last@example.com',
        phone: '8888-8888',
      })
      .expect(400);
  });

  it('returns 400 for invalid owner email', () => {
    return request(app.getHttpServer())
      .post('/api/owners')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        phone: '8888-8888',
      })
      .expect(400);
  });

  it('returns 400 when owner phone is missing', () => {
    return request(app.getHttpServer())
      .post('/api/owners')
      .send({
        firstName: 'John',
        lastName: 'Doe',
        email: 'missing.phone@example.com',
      })
      .expect(400);
  });

  it('returns 409 for duplicate owner email', async () => {
    const payload = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'duplicate.owner@example.com',
      phone: '8888-8888',
    };

    await request(app.getHttpServer())
      .post('/api/owners')
      .send(payload)
      .expect(201);

    return request(app.getHttpServer())
      .post('/api/owners')
      .send({ ...payload, phone: '9999-9999' })
      .expect(409);
  });

  it('lists owners', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/owners')
      .send({
        firstName: 'List',
        lastName: 'Owner',
        email: 'list.owner@example.com',
        phone: '8888-8888',
      })
      .expect(201);

    return request(app.getHttpServer())
      .get('/api/owners')
      .expect(200)
      .expect((response) => {
        const body = response.body as OwnerResponseBody[];
        expect(body).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: (createResponse.body as OwnerResponseBody).id,
              email: 'list.owner@example.com',
            }),
          ]),
        );
      });
  });

  it('returns an existing owner by id', async () => {
    const createResponse = await request(app.getHttpServer())
      .post('/api/owners')
      .send({
        firstName: 'Find',
        lastName: 'Owner',
        email: 'find.owner@example.com',
        phone: '8888-8888',
      })
      .expect(201);

    const created = createResponse.body as OwnerResponseBody;

    return request(app.getHttpServer())
      .get(`/api/owners/${created.id}`)
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          id: created.id,
          email: 'find.owner@example.com',
        });
      });
  });

  it('returns 404 for a missing owner', () => {
    return request(app.getHttpServer())
      .get('/api/owners/3f9ff5a1-99b8-49fd-9c6f-4c7b6e9af1de')
      .expect(404);
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

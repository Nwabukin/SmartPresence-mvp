const request = require('supertest');
jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: function () {},
  PutObjectCommand: function () {},
}));
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: async () => 'https://signed.example/put',
}));
const rekogMock = {
  mode: 'index',
};
jest.mock('@aws-sdk/client-rekognition', () => ({
  RekognitionClient: function () {
    this.send = async (cmd) => {
      if (rekogMock.mode === 'index') {
        return { FaceRecords: [{ Face: { FaceId: 'face-123' } }] };
      }
      if (rekogMock.mode === 'search') {
        return { FaceMatches: [{ Similarity: 96.5, Face: { FaceId: 'face-123', ExternalImageId: '1' } }] };
      }
      return {};
    };
  },
  IndexFacesCommand: function () {},
  SearchFacesByImageCommand: function () {},
}));

process.env.JWT_SECRET = 'testsecret';
process.env.AWS_REGION = 'us-east-1';
process.env.S3_BUCKET = 'testbucket';
process.env.REKOG_COLLECTION_ID = 'testcollection';

const app = require('../index');
const jwt = require('jsonwebtoken');

function makeToken(user) {
  return jwt.sign({ user }, process.env.JWT_SECRET);
}

describe('Biometrics endpoints', () => {
  const student = { id: 1, email: 's@example.com', role: 'student' };
  const teacher = { id: 2, email: 't@example.com', role: 'teacher' };

  it('presign-upload returns upload_url and s3_key', async () => {
    const res = await request(app)
      .post('/api/mobile/biometrics/presign-upload')
      .set('Authorization', `Bearer ${makeToken(student)}`)
      .send({ content_type: 'image/jpeg', purpose: 'enroll' });

    expect(res.status).toBe(200);
    expect(res.body.upload_url).toMatch(/^https:\/\//);
    expect(res.body.s3_key).toContain('enroll/');
  });

  it('index-face returns face_id', async () => {
    const res = await request(app)
      .post('/api/mobile/biometrics/index-face')
      .set('Authorization', `Bearer ${makeToken(student)}`)
      .send({ s3_key: 'enroll/selfies/1/abc.jpg' });

    expect(res.status).toBe(200);
    expect(res.body.face_id).toBe('face-123');
  });

  it('verify-face returns matched with confidence', async () => {
    rekogMock.mode = 'search';
    const res = await request(app)
      .post('/api/mobile/biometrics/verify-face')
      .set('Authorization', `Bearer ${makeToken(student)}`)
      .send({ s3_key: 'verify/selfies/1/abc.jpg', threshold: 90 });

    expect(res.status).toBe(200);
    expect(res.body.matched).toBe(true);
    expect(res.body.confidence).toBeGreaterThan(90);
    rekogMock.mode = 'index';
  });

  it('forbids non-students', async () => {
    const res = await request(app)
      .post('/api/mobile/biometrics/presign-upload')
      .set('Authorization', `Bearer ${makeToken(teacher)}`)
      .send({ content_type: 'image/jpeg' });
    expect(res.status).toBe(403);
  });
});


